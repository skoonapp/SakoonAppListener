import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import { db, rtdb } from '../utils/firebase';
import type { ListenerProfile, ListenerAppStatus } from '../types';

interface ListenerContextType {
  profile: ListenerProfile | null;
  loading: boolean;
}

const ListenerContext = createContext<ListenerContextType>({
  profile: null,
  loading: true,
});

export const useListener = () => useContext(ListenerContext);

interface ListenerProviderProps {
  user: firebase.User;
  children: React.ReactNode;
}

export const ListenerProvider: React.FC<ListenerProviderProps> = ({ user, children }) => {
  const [profile, setProfile] = useState<ListenerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<ListenerProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const listenerRef = db.collection('listeners').doc(user.uid);
    const statusRef = rtdb.ref('/status/' + user.uid);
    const connectedRef = rtdb.ref('.info/connected');

    // Firestore listener for profile data
    const unsubscribeFirestore = listenerRef.onSnapshot(doc => {
      if (doc.exists) {
        const newProfile = doc.data() as ListenerProfile;
        const oldProfile = profileRef.current;
        setProfile(newProfile);
        profileRef.current = newProfile; // Keep ref updated for presence logic

        // If the manual availability status has changed, sync it to RTDB immediately.
        // This is crucial for the StatusToggle to work as expected.
        if (oldProfile && oldProfile.appStatus !== newProfile.appStatus) {
            // Check connection status before writing to avoid writing while offline.
            connectedRef.once('value', (snap) => {
                if (snap.val() === true) {
                    statusRef.update({ // Use update to only change appStatus
                        appStatus: newProfile.appStatus,
                    });
                }
            });
        }
      } else {
        console.warn("Listener profile not found in Firestore for UID:", user.uid);
        setProfile(null);
        profileRef.current = null;
      }
      setLoading(false);
    }, err => {
      console.error("Error fetching listener profile:", err);
      setProfile(null);
      profileRef.current = null;
      setLoading(false);
    });

    // --- Automatic Presence System using Realtime Database (Revised for background persistence) ---
    const connectedListener = connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected).
        
        // The onDisconnect handler is a "last will". It executes when the client disconnects uncleanly.
        // It should ONLY update the live connection status (`isOnline`), not the listener's chosen availability (`appStatus`).
        statusRef.onDisconnect().set({
            isOnline: false,
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            // CRITICAL CHANGE: DO NOT set appStatus to 'Offline' here.
            // This preserves the listener's "Available" status if the app is just backgrounded.
        }).then(() => {
            // Once onDisconnect is established, set the current online status.
            // Use the most recent profile data from the ref for appStatus.
            statusRef.set({
                isOnline: true,
                lastActive: firebase.database.ServerValue.TIMESTAMP,
                appStatus: profileRef.current?.appStatus || 'Offline',
            });
        }).catch(err => {
            console.error("Could not establish onDisconnect handler:", err);
        });
      }
    });

    return () => {
      unsubscribeFirestore();
      // Detach the .info/connected listener to prevent memory leaks on unmount.
      connectedRef.off('value', connectedListener);
      // Explicit logout is handled separately in App.tsx, which correctly sets status to Offline.
      // onDisconnect handles all other cases (app crash, network loss, etc.).
    };
  }, [user]);

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
