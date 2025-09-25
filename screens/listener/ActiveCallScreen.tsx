import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../utils/firebase';
import { fetchZegoToken } from '../../utils/zego';
import { useListener } from '../../context/ListenerContext';
import type { CallRecord, ListenerAppStatus } from '../../types';

const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};


const ActiveCallScreen: React.FC = () => {
    const { callId } = useParams<{ callId: string }>();
    const { profile } = useListener();
    const navigate = useNavigate();
    const [callData, setCallData] = useState<CallRecord | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(true);
    const callContainerRef = useRef<HTMLDivElement>(null);

    // --- State for Callback Feature ---
    const [countdown, setCountdown] = useState<number | null>(null);
    const zegoInstanceRef = useRef<any>(null);

    // Effect for managing listener appStatus (Busy/Available)
    useEffect(() => {
        if (!profile) return;

        const listenerRef = db.collection('listeners').doc(profile.uid);
        let previousStatus: ListenerAppStatus = 'Available'; // Default assumption

        // Set status to 'Busy' when component mounts
        listenerRef.get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data) {
                    previousStatus = data.appStatus;
                    // Only update if not already busy
                    if (previousStatus !== 'Busy') {
                        listenerRef.update({ appStatus: 'Busy' });
                    }
                }
            }
        });

        // Restore previous status when component unmounts
        return () => {
            // Restore the actual previous status. If they were 'Offline'
            // before the call, they will be 'Offline' after. This is correct.
            listenerRef.update({ appStatus: previousStatus });
        };
    }, [profile]);


    // Effect to handle the countdown timer for callback calls
    useEffect(() => {
        if (countdown === null || !zegoInstanceRef.current) return;

        if (countdown <= 0) {
            // Time's up, leave the room. The onLeaveRoom callback will handle cleanup.
            zegoInstanceRef.current.leaveRoom();
            return;
        }

        const timerId = setInterval(() => {
            setCountdown(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timerId); // Cleanup interval on component unmount or countdown change
    }, [countdown]);


    // Effect to fetch call data and join the call
    useEffect(() => {
        if (!profile || !callId || !callContainerRef.current) return;

        const callRef = db.collection('calls').doc(callId);
        
        const unsubscribe = callRef.onSnapshot(async (doc) => {
            if (!doc.exists) {
                setError("Call not found or has ended.");
                setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
                return;
            }

            const data = doc.data() as CallRecord;
            setCallData(data);
            
            // If this is the first time loading this call, initialize Zego
            if (isJoining && callContainerRef.current) {
                setIsJoining(false);
                try {
                    const token = await fetchZegoToken(callId);
                    const zp = window.ZegoUIKitPrebuilt.create(token);
                    zegoInstanceRef.current = zp; // Store the instance for later control
                    
                    // If it's a callback, start the countdown timer
                    if (data.isCallback) {
                        setCountdown(data.maxDurationSeconds || 120);
                    }

                    zp.joinRoom({
                        container: callContainerRef.current,
                        sharedLinks: [
                            {
                                name: 'Share link',
                                url: window.location.href,
                            },
                        ],
                        scenario: {
                            mode: window.ZegoUIKitPrebuilt.OneONoneCall,
                        },
                        showScreenSharingButton: false,
                        onLeaveRoom: () => {
                            // This callback is triggered when the local user leaves the room.
                            // We can add logic here to update call status to 'completed'
                            callRef.get().then(currentDoc => {
                                if (currentDoc.exists && currentDoc.data()?.status !== 'completed') {
                                    callRef.update({ status: 'completed', endTime: new Date() })
                                      .catch(err => console.error("Failed to update call status on leave:", err));
                                }
                            });
                            navigate('/dashboard', { replace: true });
                        },
                    });
                } catch (err: any) {
                    setError(`Error joining call: ${err.message}`);
                }
            }
            
            // If the call status changes to something that terminates it
            if (['completed', 'rejected', 'missed', 'cancelled'].includes(data.status)) {
                setError(`Call has been ${data.status}. Redirecting...`);
                 setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
            }

        }, (err) => {
            setError("Failed to get call details.");
            console.error("Error fetching call:", err);
        });

        return () => unsubscribe();
    }, [profile, callId, navigate, isJoining]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-red-500">Error</h1>
                <p className="mt-2">{error}</p>
            </div>
        );
    }

    if (!callData) {
         return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <svg className="animate-spin h-8 w-8 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4">Connecting to call with {callData?.userName || 'user'}...</p>
            </div>
        );
    }
    
    return (
        <div className="relative w-screen h-screen">
            <div ref={callContainerRef} className="w-full h-full" />
            {countdown !== null && (
                <div className="absolute top-4 right-4 bg-red-600/80 text-white p-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="font-mono font-bold text-xl tracking-wider">{formatCountdown(countdown)}</span>
                </div>
            )}
        </div>
    );
};

export default ActiveCallScreen;
