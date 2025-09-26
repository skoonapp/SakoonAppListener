import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  // Use a ref to hold the latest profile, accessible inside RTDB connection closures
  // without creating stale data or re-triggering the main effect.
  const profileRef = useRef<ListenerProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const listenerRef = db.collection('listeners').doc(user.uid);
    const statusRef = rtdb.ref('/status/' + user.uid);
    const connectedRef = rtdb.ref('.info/connected');

    // This function centralizes the logic for updating RTDB presence.
    // It must be called with the LATEST profile data to ensure all writes
    // pass the strict validation rules.
    const syncPresence = (currentProfile: ListenerProfile | null) => {
        if (!currentProfile) {
            console.warn("syncPresence called without a profile. Aborting.");
            return;
        }
        
        // This is a "last will" payload. It must contain all required fields.
        // By re-registering onDisconnect on every profile change, we ensure `appStatus` is current.
        const onDisconnectPayload = {
            isOnline: false,
            lastActive: firebase.database.ServerValue.TIMESTAMP,
            appStatus: currentProfile.appStatus, // Persist manual status on disconnect
        };

        statusRef.onDisconnect().set(onDisconnectPayload)
            .then(() => {
                // Once the disconnect handler is set, update the current online status.
                // This payload must also contain all fields to be valid.
                const currentStatusPayload = {
                    isOnline: true,
                    lastActive: firebase.database.ServerValue.TIMESTAMP,
                    appStatus: currentProfile.appStatus,
                };
                return statusRef.set(currentStatusPayload);
            })
            .catch(err => {
                console.error("RTDB Presence Error: Failed to set presence.", err);
            });
    };

    // Listen to Firestore for any changes to the listener's profile.
    const firestoreUnsubscribe = listenerRef.onSnapshot(doc => {
      setLoading(false);
      if (doc.exists) {
        const newProfile = doc.data() as ListenerProfile;
        
        // Update both state (for UI) and ref (for closures).
        setProfile(newProfile);
        profileRef.current = newProfile;
        
        // Sync these changes to the Realtime Database presence system.
        syncPresence(newProfile);
      } else {
        console.warn("Listener profile not found in Firestore for UID:", user.uid);
        setProfile(null);
        profileRef.current = null;
      }
    }, err => {
      setLoading(false);
      console.error("Error fetching listener profile:", err);
      setProfile(null);
      profileRef.current = null;
    });

    // Listen to the RTDB connection state.
    const connectedListener = connectedRef.on('value', (snap) => {
      const isConnected = snap.val() === true;
      
      if (isConnected) {
        // If we just connected (or reconnected), check if we have a profile
        // and re-sync our presence immediately. Use the ref for the most current data.
        if (profileRef.current) {
            syncPresence(profileRef.current);
        }
      }
      // The onDisconnect handler automatically covers the case where `isConnected` becomes false.
    });

    return () => {
      // Cleanup listeners when the component unmounts.
      firestoreUnsubscribe();
      connectedRef.off('value', connectedListener);
      
      // DO NOT cancel the onDisconnect handler here.
      // The handleLogout function will explicitly set the final state.
      // If the app is closed abruptly, the onDisconnect that was last set WILL fire,
      // which is the desired fallback behavior.
      // statusRef.onDisconnect().cancel();
    };
  }, [user]);

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};