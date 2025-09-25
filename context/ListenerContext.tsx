import React, { createContext, useContext, useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../utils/firebase';
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

  // DEPRECATED: The real-time presence system based on RTDB connection has been removed.
  // The listener's online/offline status is now manually controlled via the 'appStatus'
  // field in their Firestore profile, allowing them to remain "online" even when the
  // app is in the background.

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};