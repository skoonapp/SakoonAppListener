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

    // --- Automatic Presence System using Realtime Database (REVISED & ROBUST PATTERN) ---
    const statusRef = rtdb.ref('/status/' + user.uid);
    const connectedRef = rtdb.ref('.info/connected');

    const connectedListener = connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        // We're connected (or reconnected).
        // First, register the onDisconnect handler. This is a promise that resolves
        // once the write is confirmed by the RTDB servers.
        statusRef.onDisconnect().set({
            isOnline: false,
            last_changed: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            // Once onDisconnect is established, set the online status.
            statusRef.set({
                isOnline: true,
                last_changed: firebase.database.ServerValue.TIMESTAMP
            });
        }).catch(err => {
            console.error("Could not establish onDisconnect handler:", err);
        });
      }
      // Note: We don't need an `else` block. The `onDisconnect` handler will
      // take care of setting the status to offline when the connection is lost.
    });

    return () => {
      unsubscribeFirestore();
      // Detach the .info/connected listener to prevent memory leaks on unmount.
      connectedRef.off('value', connectedListener);
      // We no longer manually set status to offline here.
      // The `onDisconnect` handler is the source of truth for all disconnects.
      // Explicit logout is handled separately in App.tsx. This change also
      // correctly supports having the app open in multiple tabs.
    };
  }, [user]);

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};