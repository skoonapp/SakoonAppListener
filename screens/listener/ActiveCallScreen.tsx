



import React, { useEffect, useRef, useState } from 'react';
// FIX: Changed import from 'react-router-dom' to 'react-router' to resolve module export errors for hooks.
import { useParams, useNavigate } from 'react-router';
import { db } from '../../utils/firebase';
import { fetchZegoToken } from '../../utils/zego';
import { useListener } from '../../context/ListenerContext';
import type { CallRecord } from '../../types';

const ActiveCallScreen: React.FC = () => {
    const { callId } = useParams<{ callId: string }>();
    const { profile } = useListener();
    // FIX: Upgraded from useHistory (v5) to useNavigate (v6).
    const navigate = useNavigate();
    const [callData, setCallData] = useState<CallRecord | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(true);
    const callContainerRef = useRef<HTMLDivElement>(null);

    // Effect to fetch call data and join the call
    useEffect(() => {
        if (!profile || !callId || !callContainerRef.current) return;

        const callRef = db.collection('calls').doc(callId);
        
        const unsubscribe = callRef.onSnapshot(async (doc) => {
            if (!doc.exists) {
                setError("Call not found or has ended.");
                // FIX: Upgraded from history.replace (v5) to navigate (v6).
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
                            // FIX: Upgraded from history.replace (v5) to navigate (v6).
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
                 // FIX: Upgraded from history.replace (v5) to navigate (v6).
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
    
    return <div ref={callContainerRef} className="w-screen h-screen" />;
};

export default ActiveCallScreen;