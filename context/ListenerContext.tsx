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

  // Effect 2a: Manage RTDB connection status (isOnline flag)
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    const statusRef = rtdb.ref(`/status/${uid}`);
    const connectedRef = rtdb.ref('.info/connected');

    const listener = connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        // We're connected.
        // Set onDisconnect to mark us offline when we disconnect.
        statusRef.onDisconnect().update({ isOnline: false, lastActive: firebase.database.ServerValue.TIMESTAMP })
          .catch(err => console.error("RTDB onDisconnect for isOnline failed:", err));

        // Set the isOnline status to true.
        statusRef.update({ isOnline: true })
          .catch(err => console.error("RTDB update for isOnline failed:", err));
      }
      // If snap.val() is false, the onDisconnect handler takes care of it when the connection is truly lost.
    });

    return () => {
      connectedRef.off('value', listener);
    };
  }, [user]);

  // Effect 2b: Sync profile data (appStatus) to RTDB
  useEffect(() => {
    if (!user || !profile) return;
    
    const uid = user.uid;
    const statusRef = rtdb.ref(`/status/${uid}`);

    // When the profile's appStatus changes, update it in RTDB.
    statusRef.update({ 
      appStatus: profile.appStatus,
      lastActive: firebase.database.ServerValue.TIMESTAMP 
    })
      .catch(err => console.error("RTDB sync for appStatus failed:", err));

  }, [user, profile]);


  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
