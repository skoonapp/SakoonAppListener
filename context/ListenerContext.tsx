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

    setLoading(true);

    const listenerRef = db.collection('listeners').doc(user.uid);

    // Firestore listener for profile data
    const unsubscribeFirestore = listenerRef.onSnapshot(doc => {
      if (doc.exists) {
        const data = doc.data() as ListenerProfile;
        // Add the isOnline field to the profile type if it doesn't exist for type safety
        const profileWithPresence = { ...data, isOnline: data.isOnline ?? (data.appStatus === 'Available') };
        setProfile(profileWithPresence);
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
    
    // The RTDB presence system has been removed to allow the app to be "online"
    // for push notifications even when the browser tab is closed. The user's
    // online status is now managed directly through Firestore via the dashboard toggle,
    // logout actions, and call status.

    return () => {
      unsubscribeFirestore();
    };
  }, [user]);

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
