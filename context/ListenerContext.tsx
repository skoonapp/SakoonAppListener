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

  // Effect 2: Manage Realtime Database presence and status sync.
  useEffect(() => {
    // We need a user to do anything and the profile to know the listener's desired appStatus.
    // If it's not loaded yet, this effect will re-run when it is.
    if (!user || !profile) {
        return;
    }

    const uid = user.uid;
    const statusRef = rtdb.ref(`/status/${uid}`);
    const connectedRef = rtdb.ref('.info/connected');

    const listener = connectedRef.on('value', (snap) => {
        if (snap.val() === false) {
            // We are disconnected. The onDisconnect() handler set below will take care of updating the status.
            return;
        }

        // --- We are connected (or have just re-connected) ---
        
        // 1. Set the onDisconnect "last will". This must be set every time we connect.
        // This payload will be written to RTDB if the client disconnects ungracefully.
        const onDisconnectPayload = {
            isOnline: false, // When connection is lost, they are not online.
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            appStatus: profile.appStatus, // Preserve the listener's manually set status.
        };
        statusRef.onDisconnect().set(onDisconnectPayload)
            .catch(err => console.error("RTDB onDisconnect setup failed:", err));

        // 2. Set the current status now that we are connected.
        // This overwrites any stale data (e.g., if onDisconnect just fired).
        const currentStatusPayload = {
            isOnline: true, // We are connected, so isOnline is true.
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            appStatus: profile.appStatus, // Sync the current appStatus from the profile.
        };
        statusRef.set(currentStatusPayload)
            .catch(err => console.error("RTDB re-connect sync failed:", err));
    });

    // Cleanup function for when the component unmounts (e.g., logout).
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