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

  // Effect 1: Subscribe to Firestore profile changes.
  // This is the single source of truth for the listener's manually set `appStatus`.
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

  // Effect 2: Manage Realtime Database presence.
  // This effect runs whenever the profile changes, ensuring the presence logic
  // always has the latest `appStatus`.
  useEffect(() => {
    // Don't manage presence until the profile is fully loaded.
    if (!profile) return;

    const statusRef = rtdb.ref('/status/' + profile.uid);
    const connectedRef = rtdb.ref('.info/connected');

    const listener = (snap: firebase.database.DataSnapshot) => {
      if (snap.val() === true) {
        // We are connected.

        // Set the "last will" for ungraceful disconnects.
        // It should always mark the user as offline, but preserve their last known appStatus.
        statusRef.onDisconnect().set({
          isOnline: false,
          lastActive: firebase.database.ServerValue.TIMESTAMP,
          appStatus: profile.appStatus, // Use the most recent appStatus from the loaded profile
        }).catch(err => console.error("RTDB Presence: Failed to set onDisconnect.", err));

        // Set the current status now.
        // `isOnline` is true ONLY if the listener has set their `appStatus` to 'Available'.
        const isActuallyOnline = profile.appStatus === 'Available';
        
        statusRef.set({
          isOnline: isActuallyOnline,
          lastActive: firebase.database.ServerValue.TIMESTAMP,
          appStatus: profile.appStatus,
        }).catch(err => console.error("RTDB Presence: Failed to set online status.", err));
      }
    };

    connectedRef.on('value', listener);

    return () => {
      // Cleanup: remove the listener when the component unmounts or the profile changes,
      // preventing multiple listeners from being attached.
      connectedRef.off('value', listener);
    };
  }, [profile]); // Key dependency: This ENTIRE effect re-runs when `profile` changes.

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
