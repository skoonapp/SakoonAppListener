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
    
    setLoading(true); // Reset loading state when user changes

    const unsubscribe = db.collection('listeners').doc(user.uid)
      .onSnapshot(doc => {
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

    return () => unsubscribe();
  }, [user]);

  // Effect for managing real-time presence
  useEffect(() => {
    if (!user) return;

    const listenerStatusRef = rtdb.ref(`/status/${user.uid}`);
    const firestoreListenerRef = db.collection('listeners').doc(user.uid);

    const isOfflineForRTDB = {
        isOnline: false,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
    };
    const isOnlineForRTDB = {
        isOnline: true,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
    };

    rtdb.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === false) {
            firestoreListenerRef.update({
                isOnline: false,
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return;
        }

        listenerStatusRef.onDisconnect().set(isOfflineForRTDB).then(() => {
            listenerStatusRef.set(isOnlineForRTDB);
            firestoreListenerRef.update({
                isOnline: true,
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            });
        });
    });

    return () => {
        rtdb.ref('.info/connected').off();
        listenerStatusRef.set(isOfflineForRTDB);
        firestoreListenerRef.update({
            isOnline: false,
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        });
    };
  }, [user]);

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};