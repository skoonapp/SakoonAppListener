import React, { createContext, useContext, useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db, rtdb } from '../utils/firebase';
import type { ListenerProfile } from '../types';

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

  // Effect 1: Subscribe to Firestore for the profile, which is the single source of truth for appStatus.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const listenerRef = db.collection('listeners').doc(user.uid);
    const unsubscribe = listenerRef.onSnapshot(doc => {
      setLoading(false);
      if (doc.exists) {
        setProfile(doc.data() as ListenerProfile);
      } else {
        console.warn("Listener profile not found for UID:", user.uid);
        setProfile(null);
      }
    }, err => {
      setLoading(false);
      console.error("Error fetching listener profile:", err);
      setProfile(null);
    });

    return () => unsubscribe();
  }, [user]);

  // Effect 2: Manage Realtime Database presence with separated logic.
  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    const uid = user.uid;
    const statusRef = rtdb.ref(`/status/${uid}`);
    const connectedRef = rtdb.ref('.info/connected');

    // --- Part A: Direct Status Sync ---
    // This runs every time the profile changes, ensuring RTDB is always in sync with Firestore `appStatus`.
    // This is the definitive fix for the 'isOnline' bug.
    const isListenerAvailable = profile.appStatus === 'Available';
    const currentStatusPayload = {
        isOnline: isListenerAvailable,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
        appStatus: profile.appStatus,
    };

    statusRef.set(currentStatusPayload)
        .catch(err => console.error("Direct RTDB sync failed:", err));

    // --- Part B: Connection State Management ---
    // This sets up the "last will" for abrupt disconnects and handles re-connection.
    const listener = connectedRef.on('value', (snap) => {
        if (snap.val() === false) {
            // We are disconnected. The onDisconnect() handler set below will take care of updating the status.
            return;
        }

        // We are connected (or have just re-connected).
        // 1. Set the onDisconnect "last will". This must be set every time we connect.
        const onDisconnectPayload = {
            isOnline: false, // Disconnected always means not online.
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            appStatus: profile.appStatus, // Preserve the listener's manually set status.
        };
        statusRef.onDisconnect().set(onDisconnectPayload)
            .catch(err => console.error("RTDB onDisconnect setup failed:", err));

        // 2. When we connect or re-connect, re-apply the current status. This is important
        // because the onDisconnect handler might have just fired if it was a brief disconnect.
        statusRef.set(currentStatusPayload)
            .catch(err => console.error("RTDB re-connect sync failed:", err));
    });

    // Cleanup function
    return () => {
        // Remove the connection listener to prevent memory leaks.
        connectedRef.off('value', listener);
    };
  }, [user, profile]); // CRITICAL: Re-run this whole setup when user or their profile changes.


  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};