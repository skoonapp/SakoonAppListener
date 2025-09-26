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

  // Effect 2: Manage Realtime Database presence. This is the definitive fix.
  useEffect(() => {
    // Exit early if we don't have the necessary user and profile data.
    if (!user || !profile) {
      return;
    }

    const uid = user.uid;
    const statusRef = rtdb.ref(`/status/${uid}`);
    const connectedRef = rtdb.ref('.info/connected');

    // This listener handles both initial connection and any subsequent profile changes.
    // Re-attaching it in the effect hook causes it to fire with the current connection state.
    const listener = connectedRef.on('value', (snap) => {
        // If we're not connected, we can't do anything. The onDisconnect will handle it.
        if (snap.val() === false) {
            return;
        }

        // --- We are connected ---

        // 1. Set the "last will". This is what the server will do if we disconnect unexpectedly.
        // It uses the latest appStatus from the profile in the closure.
        const onDisconnectPayload = {
            isOnline: false, // Disconnected always means not online.
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            appStatus: profile.appStatus, // Preserve the listener's manually set status.
        };

        statusRef.onDisconnect().set(onDisconnectPayload)
            .catch(err => console.error("RTDB onDisconnect setup failed:", err));

        // 2. Set the CURRENT status. This is the crucial part that fixes the bug.
        // This code runs whenever we are connected AND whenever the `profile` object changes,
        // because the effect re-runs and re-attaches this listener.
        const isListenerAvailable = profile.appStatus === 'Available';

        const currentStatusPayload = {
            isOnline: isListenerAvailable, // This value is now correctly tied to appStatus.
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            appStatus: profile.appStatus,
        };

        statusRef.set(currentStatusPayload)
            .catch(err => console.error("RTDB failed to set current status:", err));
    });

    // Cleanup: Remove the listener when the component unmounts or dependencies change
    // to prevent memory leaks and redundant listeners.
    return () => {
        connectedRef.off('value', listener);
    };
  }, [user, profile]); // CRITICAL: Re-run this whole setup when user or their profile changes.

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
