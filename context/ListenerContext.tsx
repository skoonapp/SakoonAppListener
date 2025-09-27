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

  // Effect 2a: Manage RTDB connection status (isOnline flag) with a robust presence system.
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    const statusRef = rtdb.ref(`/status/${uid}`);
    const connectedRef = rtdb.ref('.info/connected');

    let heartbeatInterval: number | undefined;

    const connectedListener = connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        // We're connected.
        const connectionData = {
          isOnline: true,
          lastActive: firebase.database.ServerValue.TIMESTAMP,
          appState: 'foreground',
          deviceOnline: true,
        };

        // Set onDisconnect to mark us offline when we disconnect. This is critical.
        statusRef.onDisconnect().set({
            isOnline: false,
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            appState: 'closed'
        }).catch(err => console.error("RTDB onDisconnect setup failed:", err));

        // Set the initial online status.
        statusRef.update(connectionData).catch(err => console.error("RTDB initial online status update failed:", err));

        // Start a regular heartbeat to keep the 'lastActive' timestamp fresh.
        heartbeatInterval = window.setInterval(() => {
            statusRef.update({ heartbeat: firebase.database.ServerValue.TIMESTAMP });
        }, 30000); // Every 30 seconds

      }
    });
    
    // Listen for app visibility changes (tab in focus or background)
    const handleVisibilityChange = () => {
        if (document.hidden) {
            statusRef.update({ appState: 'background' });
        } else {
            statusRef.update({ appState: 'foreground', isOnline: true, lastActive: firebase.database.ServerValue.TIMESTAMP });
        }
    };
    
    // Listen for browser's network connection status
    const handleOnline = () => statusRef.update({ deviceOnline: true, isOnline: true });
    const handleOffline = () => statusRef.update({ deviceOnline: false });
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      // Cleanup all listeners and intervals
      connectedRef.off('value', connectedListener);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // When the component unmounts (e.g., during a clean logout),
      // explicitly set the status to offline.
      statusRef.update({ isOnline: false, appState: 'background' });
    };
  }, [user]);

  // Effect 2b: Sync profile data (appStatus) from Firestore state to RTDB
  useEffect(() => {
    if (!user || !profile) return;
    
    const uid = user.uid;
    const statusRef = rtdb.ref(`/status/${uid}`);

    // When the profile's appStatus changes, update it in RTDB.
    statusRef.update({ 
      appStatus: profile.appStatus,
    }).catch(err => console.error("RTDB sync for appStatus failed:", err));

  }, [user, profile]);


  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};