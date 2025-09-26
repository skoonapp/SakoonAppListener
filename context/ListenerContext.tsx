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

  // Effect 2: Manage Realtime Database presence based on the profile from Firestore.
  // This is now the definitive logic for online status.
  useEffect(() => {
    // Wait until we have a user and a profile to work with.
    if (!user || !profile) return;

    const statusRef = rtdb.ref('/status/' + user.uid);
    const connectedRef = rtdb.ref('.info/connected');

    // Set up the "last will" (onDisconnect). This runs if the connection is lost abruptly.
    // It uses the latest appStatus from the profile to maintain state consistency.
    statusRef.onDisconnect().set({
      isOnline: false,
      lastActive: firebase.database.ServerValue.TIMESTAMP,
      appStatus: profile.appStatus,
    }).catch(err => console.error("RTDB: Failed to set onDisconnect.", err));


    // This is the crucial part:
    // A listener is only considered "online" if their appStatus is "Available".
    const isOnline = profile.appStatus === 'Available';

    // Directly set the complete, correct status in RTDB every time the profile changes.
    // This ensures that when appStatus changes to 'Offline', isOnline immediately becomes 'false'.
    statusRef.set({
      isOnline: isOnline,
      lastActive: firebase.database.ServerValue.TIMESTAMP,
      appStatus: profile.appStatus,
    }).catch(err => console.error("RTDB: Failed to set status on profile update.", err));

    // We still listen to the connection state primarily to manage the onDisconnect handler correctly,
    // though the main logic above now handles all state changes directly.
    const connectionListener = connectedRef.on('value', snap => {
        if (snap.val() === false && profile) {
            // If we detect a disconnect, RTDB's onDisconnect will handle the final state.
            // No immediate client-side action is needed as it can be unreliable.
        }
    });

    return () => {
      connectedRef.off('value', connectionListener);
      // On a clean unmount (like logout), the logout function handles setting the final offline state.
      // On a dirty unmount (like closing the tab), onDisconnect handles it.
      // So, we don't need to do anything extra here.
    };
  }, [user, profile]); // Re-run this entire logic block whenever user or profile changes.

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
