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
  const [isConnected, setIsConnected] = useState(false);

  // Effect to manage Firestore profile subscription
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const listenerRef = db.collection('listeners').doc(user.uid);
    const firestoreUnsubscribe = listenerRef.onSnapshot(doc => {
      setLoading(false);
      if (doc.exists) {
        setProfile(doc.data() as ListenerProfile);
      } else {
        console.warn("Listener profile not found in Firestore for UID:", user.uid);
        setProfile(null);
      }
    }, err => {
      setLoading(false);
      console.error("Error fetching listener profile:", err);
      setProfile(null);
    });

    return () => firestoreUnsubscribe();
  }, [user]);

  // Effect to manage RTDB connection state
  useEffect(() => {
    const connectedRef = rtdb.ref('.info/connected');
    const listener = (snap: firebase.database.DataSnapshot) => {
      setIsConnected(snap.val() === true);
    };
    connectedRef.on('value', listener);
    return () => connectedRef.off('value', listener);
  }, []);


  // The main presence synchronization effect.
  // This runs whenever the user's profile or connection status changes.
  useEffect(() => {
    if (!profile) {
      return; // Wait for profile to load
    }
    
    const statusRef = rtdb.ref('/status/' + profile.uid);

    // This is the "last will" payload, executed by Firebase servers on ungraceful disconnect.
    // It should always set isOnline to false. The appStatus is preserved from the last known state.
    const onDisconnectPayload = {
      isOnline: false,
      lastActive: firebase.database.ServerValue.TIMESTAMP,
      appStatus: profile.appStatus,
    };

    statusRef.onDisconnect().set(onDisconnectPayload)
      .catch(err => console.error("RTDB Presence Error: Failed to set onDisconnect.", err));

    // If we are not connected, we shouldn't try to write our status.
    // The onDisconnect handler is already set and will take care of things if the connection drops.
    // When the connection returns, `isConnected` will become true, and this effect will run again.
    if (isConnected) {
      // Determine the correct online status. A user is only "online" if their app is connected
      // AND they have manually set their status to "Available".
      const shouldBeOnline = profile.appStatus === 'Available';

      const currentStatusPayload = {
        isOnline: shouldBeOnline,
        lastActive: firebase.database.ServerValue.TIMESTAMP,
        appStatus: profile.appStatus,
      };

      statusRef.set(currentStatusPayload)
        .catch(err => console.error("RTDB Presence Error: Failed to set current status.", err));
    }

  }, [profile, isConnected]); // This is the key: react to both profile and connection changes.


  return (
    <ListenerContext.Provider value={{ profile, loading }}>
      {children}
    </ListenerContext.Provider>
  );
};
