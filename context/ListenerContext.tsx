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

  // Effect 2: Manage Realtime Database presence based on the profile from Firestore.
  // This is the definitive logic for online status.
  useEffect(() => {
    // Wait until we have a user and a profile to work with.
    if (!user || !profile) return;

    const statusRef = rtdb.ref('/status/' + user.uid);

    // This is the source of truth.
    // If the user's profile says they want to be 'Available', then isOnline is true.
    // For any other status (Offline, Busy, etc.), it's false.
    const isActuallyOnline = profile.appStatus === 'Available';

    const statusPayload = {
        isOnline: isActuallyOnline, // <-- The critical logic
        lastActive: firebase.database.ServerValue.TIMESTAMP,
        appStatus: profile.appStatus,
    };
    
    // Set the "last will" for abrupt disconnects (e.g., closing the browser).
    // If the app closes unexpectedly, they are not online.
    const onDisconnectPayload = {
        isOnline: false,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
        appStatus: profile.appStatus, // Preserve their chosen status for context
    };

    statusRef.onDisconnect().set(onDisconnectPayload)
        .catch(err => console.error("RTDB: Failed to set onDisconnect.", err));

    // Now, set the CURRENT status every time the profile changes.
    // This is the most important part that fixes the bug.
    statusRef.set(statusPayload)
        .catch(err => console.error("RTDB: Failed to set current status on profile update.", err));
    
    // The cleanup is handled by the onDisconnect for abrupt closes,
    // and by the logout function for clean logouts. No extra logic needed here.
    return () => {
      // Intentionally left blank. We don't want to cancel the onDisconnect
      // unless it's a clean logout, which is handled elsewhere.
    };
  }, [user, profile]); // Re-run this entire logic block whenever user or profile changes.

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
