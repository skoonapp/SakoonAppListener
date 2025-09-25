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

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const listenerRef = db.collection('listeners').doc(user.uid);

    // Firestore listener for profile data
    const unsubscribeFirestore = listenerRef.onSnapshot(doc => {
      if (doc.exists) {
        setProfile(doc.data() as ListenerProfile);
      } else {
        console.warn("Listener profile not found in Firestore for UID:", user.uid);
        setProfile(null);
      }
      setLoading(false);
    }, err => {
      console.error("Error fetching listener profile:", err);
      setProfile(null);
      setLoading(false);
    });

    // --- Automatic Presence System using Realtime Database ---
    const statusRef = rtdb.ref('/status/' + user.uid);
    const connectedRef = rtdb.ref('.info/connected');

    const connectedListener = connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected). Go online.
        statusRef.set({ isOnline: true, last_changed: firebase.database.ServerValue.TIMESTAMP });

        // When the client disconnects, update their status to offline.
        // This is the core of the presence system.
        statusRef.onDisconnect().set({ isOnline: false, last_changed: firebase.database.ServerValue.TIMESTAMP });
      }
    });

    return () => {
      unsubscribeFirestore();
      connectedRef.off('value', connectedListener); // Detach the listener
      // On clean component unmount, set offline status. This isn't strictly necessary
      // because onDisconnect handles browser close, but it provides a faster response.
      statusRef.set({ isOnline: false, last_changed: firebase.database.ServerValue.TIMESTAMP });
    };
  }, [user]);

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};