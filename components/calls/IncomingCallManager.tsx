

import React, { useEffect } from 'react';
// FIX: Corrected react-router import. In v6, hooks should be imported from 'react-router-dom'.
import { useNavigate, useLocation } from 'react-router-dom';
import { messaging, db } from '../../utils/firebase';
import { useListener } from '../../context/ListenerContext';
import firebase from 'firebase/compat/app';

// --- Self-contained Audio Manager using Web Audio API ---
let audioContext: AudioContext | null = null;
let ringtoneSource: { oscillator: OscillatorNode, gain: GainNode, intervalId: number } | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported.", e);
        }
    }
    // Autoplay policy requires user interaction to start/resume audio context.
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(e => console.error("Could not resume audio context", e));
    }
    return audioContext;
};

const playRingtone = () => {
    const ctx = getAudioContext();
    if (!ctx || ringtoneSource) return; // Already playing or not supported

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    
    const playBeepSequence = () => {
        const now = ctx.currentTime;
        oscillator.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        oscillator.frequency.setValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.5, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    };

    const intervalId = window.setInterval(playBeepSequence, 1200);
    playBeepSequence(); // Play immediately once
    oscillator.start();
    ringtoneSource = { oscillator, gain, intervalId };
};

const stopRingtone = () => {
    if (ringtoneSource) {
        clearInterval(ringtoneSource.intervalId);
        // Add a short fade out to avoid clicking sound
        const ctx = getAudioContext();
        if (ctx) {
            const now = ctx.currentTime;
            ringtoneSource.gain.gain.cancelScheduledValues(now);
            ringtoneSource.gain.gain.setValueAtTime(ringtoneSource.gain.gain.value, now);
            ringtoneSource.gain.gain.linearRampToValueAtTime(0, now + 0.1);
        }
        
        setTimeout(() => {
            if (ringtoneSource) {
                ringtoneSource.oscillator.stop();
                ringtoneSource.oscillator.disconnect();
                ringtoneSource.gain.disconnect();
                ringtoneSource = null;
            }
        }, 150); // wait for fade out
    }
};

const playMessageTone = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(900, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
};
// --- End Audio Manager ---


const IncomingCallManager: React.FC = () => {
  const { profile } = useListener();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!messaging || !profile) {
      return;
    }

    const setupNotifications = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          const currentToken = await messaging.getToken({
            vapidKey: 'BDS6yZUIoOU5Kz0I1XVbNlO3p_e-1G2yF2P2aKsoj1Z2t3hfkq_pKztz8G1-vlnQLtXklqP7wy28b7XhGchpWJI', // Replace with your VAPID key
          });
          
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            // Save the token to the listener's profile if it's not already there
            const listenerRef = db.collection('listeners').doc(profile.uid);
            await listenerRef.update({
                fcmTokens: firebase.firestore.FieldValue.arrayUnion(currentToken)
            });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    setupNotifications();

    // Handle foreground messages
    const unsubscribe = messaging.onMessage((payload) => {
      console.log('Message received in foreground. ', payload);
      const { type, userName, callId } = payload.data || {};

      if (type === 'incoming_call') {
        // Default to true if setting is undefined
        if (profile.notificationSettings?.calls !== false) {
          playRingtone();
        }

        const isConfirmed = window.confirm(
          `${userName || 'A user'} is calling. Do you want to accept?`
        );
        stopRingtone(); // Stop ringtone after user interacts with prompt

        if (isConfirmed && callId) {
          navigate(`/call/${callId}`);
        } else {
          // TODO: Implement call rejection logic
          console.log('Call rejected by listener from foreground prompt.');
        }
      } else if (type === 'new_message') {
          const isOnChatScreen = location.pathname.includes('/chat');
          // Default to true if setting is undefined
          if (!isOnChatScreen && profile.notificationSettings?.messages !== false) {
              playMessageTone();
          }
      }
    });

    return () => {
      unsubscribe();
      stopRingtone(); // Ensure ringtone stops if component unmounts while ringing
    };
  }, [profile, navigate, location]);

  return null; // This component does not render anything itself.
};

export default IncomingCallManager;