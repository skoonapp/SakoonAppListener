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

  // Effect for managing real-time presence, now correctly handles admins.
  useEffect(() => {
    // Wait for both user and profile to be loaded to make a decision.
    if (!user || !profile) return;

    const listenerStatusRef = rtdb.ref(`/status/${user.uid}`);
    const firestoreListenerRef = db.collection('listeners').doc(user.uid);
    const connectedRef = rtdb.ref('.info/connected');

    // If the user is an admin, ensure they are marked as offline and do not set up presence.
    if (profile.isAdmin) {
        const adminOfflineStateRTDB = {
            isOnline: false,
            lastActive: firebase.database.ServerValue.TIMESTAMP,
        };
        const adminOfflineStateFirestore = {
            isOnline: false,
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        };
        // Set offline status to clean up any lingering online state.
        listenerStatusRef.set(adminOfflineStateRTDB);
        firestoreListenerRef.update(adminOfflineStateFirestore);
        
        // Ensure no presence listeners are attached for admins.
        connectedRef.off(); 
        return; 
    }

    // --- Presence logic for regular listeners ---
    const isOfflineForRTDB = {
        isOnline: false,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
    };
    const isOnlineForRTDB = {
        isOnline: true,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
    };

    const onConnectStatusChange = (snapshot: firebase.database.DataSnapshot) => {
        if (snapshot.val() === false) {
            // Use Firestore server timestamp for consistency when disconnected.
            firestoreListenerRef.update({
                isOnline: false,
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            });
            return;
        }

        // When connected, set up onDisconnect behavior and then set current status to online.
        listenerStatusRef.onDisconnect().set(isOfflineForRTDB).then(() => {
            listenerStatusRef.set(isOnlineForRTDB);
            firestoreListenerRef.update({
                isOnline: true,
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            });
        });
    };

    connectedRef.on('value', onConnectStatusChange);

    // Cleanup function when component unmounts or dependencies change.
    return () => {
        connectedRef.off('value', onConnectStatusChange); // Detach the specific listener
        // When logging out or switching users, explicitly set the listener to offline.
        if (!profile.isAdmin) {
             listenerStatusRef.set(isOfflineForRTDB);
             firestoreListenerRef.update({
                isOnline: false,
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            });
        }
    };
    // FIX: Changed dependency array to prevent an infinite loop. The presence logic should only
    // re-run if the user changes or their admin status changes, not on every minor profile
    // update like `isOnline` or `lastActive`, which this effect causes itself.
  }, [user, profile?.uid, profile?.isAdmin]); 

  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};