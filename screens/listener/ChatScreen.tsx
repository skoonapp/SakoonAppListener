import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useListener } from '../../context/ListenerContext';
import { db, storage } from '../../utils/firebase';
import type { ListenerChatSession, ChatMessage, CallRecord } from '../../types';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import firebase from 'firebase/compat/app';
import { useNotification } from '../../context/NotificationContext';
import { usePTR } from '../../context/PTRContext';

const formatSessionTime = (timestamp: firebase.firestore.Timestamp | undefined): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    // Check if it's today
    if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
        return 'Yesterday';
    }
    // Otherwise, show date
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
};


const ChatScreen: React.FC = () => {
    const { profile } = useListener();
    const [sessions, setSessions] = useState<ListenerChatSession[]>([]);
    const [activeSession, setActiveSession] = useState<ListenerChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { showNotification } = useNotification();
    const { enablePTR, disablePTR } = usePTR();

    const handleRefresh = useCallback(async () => {
        // Since chat sessions are real-time, this provides a UX confirmation of a sync.
        console.log("Refreshing chat sessions...");
        await new Promise(resolve => setTimeout(resolve, 1000));
    }, []);

    useEffect(() => {
        enablePTR(handleRefresh);
        return () => disablePTR();
    }, [enablePTR, disablePTR, handleRefresh]);


    // Fetch chat sessions
    useEffect(() => {
        if (!profile?.uid) return;
        setLoading(true);
        const unsubscribe = db.collection('chats')
            .where('listenerId', '==', profile.uid)
            .orderBy('lastMessageTimestamp', 'desc')
            .onSnapshot(snapshot => {
                const sessionData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ListenerChatSession));
                setSessions(sessionData);
                setLoading(false);
            }, error => {
                console.error("Error fetching chat sessions:", error);
                setLoading(false);
            });
        return () => unsubscribe();
    }, [profile?.uid]);

    // Fetch messages for active session
    useEffect(() => {
        if (!activeSession) {
            setMessages([]);
            return;
        }
        // Optimization: Fetch only the last 50 messages to improve performance on long chats.
        const unsubscribe = db.collection('chats').doc(activeSession.id).collection('messages')
            .orderBy('timestamp', 'desc') // Order by desc to get the last N messages
            .limit(50)
            .onSnapshot(snapshot => {
                const messagesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ChatMessage))
                .reverse(); // Reverse the array on the client to display in correct order
                setMessages(messagesData);
            });
        return () => unsubscribe();
    }, [activeSession]);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const checkForVoiceMessageBonus = async (userId: string, audioDuration: number) => {
        if (!profile) return;
        // Condition 1: Audio must be >= 10 seconds
        if (audioDuration < 10) {
            return;
        }

        // Condition 2: Must be within 1 minute of a completed call
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

        const callsRef = db.collection('calls');
        const q = callsRef
            .where('listenerId', '==', profile.uid)
            .where('userId', '==', userId)
            .where('status', '==', 'completed')
            .where('endTime', '>=', oneMinuteAgo)
            .orderBy('endTime', 'desc')
            .limit(1);

        try {
            const snapshot = await q.get();
            if (snapshot.empty) {
                return; // No eligible call found
            }

            const callDoc = snapshot.docs[0];
            const callData = callDoc.data() as CallRecord;

            // Condition 3: Bonus must not have been awarded already
            if (callData.bonusAwarded) {
                return;
            }

            // All conditions met, award the bonus using a transaction
            const callRef = db.collection('calls').doc(callDoc.id);
            const listenerRef = db.collection('listeners').doc(profile.uid);
            const earningsRef = listenerRef.collection('earnings');
            const bonusAmount = 2.00;

            await db.runTransaction(async (transaction) => {
                const freshCallDoc = await transaction.get(callRef);
                if (freshCallDoc.data()?.bonusAwarded) {
                    return; // Abort if bonus was awarded in a parallel process
                }
                transaction.update(callRef, { bonusAwarded: true });
                transaction.update(listenerRef, {
                    totalEarnings: firebase.firestore.FieldValue.increment(bonusAmount)
                });
                transaction.set(earningsRef.doc(), {
                    amount: bonusAmount,
                    type: 'bonus',
                    sourceId: callDoc.id,
                    userName: callData.userName,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            showNotification(`🎉 Bonus of ₹${bonusAmount.toFixed(2)} earned for quick follow-up!`, 'success');

        } catch (error) {
            console.error("Error awarding bonus:", error);
            showNotification('Could not process bonus due to an error.', 'error');
        }
    };


    const handleSendText = async (text: string) => {
        if (!profile || !activeSession) return;
        const message: Omit<ChatMessage, 'id'> = {
            senderId: profile.uid,
            text: text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
            status: 'sent',
            type: 'text',
        };
        await db.collection('chats').doc(activeSession.id).collection('messages').add(message);
    };
    
    const handleSendAudio = async (audioBlob: Blob, duration: number) => {
        if (!profile || !activeSession) return;
        const filePath = `chats/${activeSession.id}/${new Date().getTime()}.webm`;
        const fileRef = storage.ref(filePath);
        await fileRef.put(audioBlob);
        const audioUrl = await fileRef.getDownloadURL();
        
        const message: Omit<ChatMessage, 'id'> = {
            senderId: profile.uid,
            text: 'Voice message',
            timestamp: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
            status: 'sent',
            type: 'audio',
            audioUrl: audioUrl,
            duration: Math.round(duration),
        };
        await db.collection('chats').doc(activeSession.id).collection('messages').add(message);
        
        // After sending the message, check if a bonus should be awarded.
        await checkForVoiceMessageBonus(activeSession.userId, duration);
    };

    return (
        <div className="flex h-full">
            {/* Sessions List */}
            <div className={`w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col ${activeSession ? 'hidden md:flex' : 'flex'}`}>
                <header className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <input type="search" placeholder="Search chats..." className="w-full bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </header>
                <div className="flex-grow overflow-y-auto">
                    {loading ? <p className="p-4">Loading chats...</p> : sessions.map(session => (
                        <div key={session.id} onClick={() => setActiveSession(session)} className={`p-3 cursor-pointer flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 ${activeSession?.id === session.id ? 'bg-cyan-50 dark:bg-slate-700/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            {/* Avatar placeholder */}
                            <img src={session.userAvatar || `https://ui-avatars.com/api/?name=${session.userName}&background=random`} alt={session.userName} className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0 object-cover"/>
                            <div className="flex-grow overflow-hidden">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{session.userName}</h3>
                                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                                        {formatSessionTime(session.lastMessageTimestamp)}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{session.lastMessageText}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Message View */}
            <div className={`w-full md:w-2/3 flex flex-col ${activeSession ? 'flex' : 'hidden md:flex'}`}>
                {activeSession ? (
                    <>
                        <header className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                            <button onClick={() => setActiveSession(null)} className="md:hidden p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                             <img src={activeSession.userAvatar || `https://ui-avatars.com/api/?name=${activeSession.userName}&background=random`} alt={activeSession.userName} className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 object-cover"/>
                            <h2 className="font-bold text-slate-800 dark:text-slate-200">{activeSession.userName}</h2>
                        </header>
                        <div className="flex-grow p-4 overflow-y-auto bg-slate-100/50 dark:bg-slate-900">
                            {messages.map(msg => (
                                <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.senderId === profile?.uid} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-2 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <ChatInput onSendText={handleSendText} onSendAudio={handleSendAudio} recentMessages={messages.slice(-5)} />
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <p>Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatScreen;
