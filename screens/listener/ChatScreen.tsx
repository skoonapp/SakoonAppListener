import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useListener } from '../../context/ListenerContext';
import { db, storage, functions } from '../../utils/firebase';
import type { ListenerChatSession, ChatMessage, CallRecord } from '../../types';
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import firebase from 'firebase/compat/app';
import { useNotification } from '../../context/NotificationContext';
import { usePTR } from '../../context/PTRContext';
import { useNavigate } from 'react-router-dom';

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

// --- Chat Session List Item ---
const SessionItem: React.FC<{ session: ListenerChatSession; isActive: boolean; onClick: () => void; }> = ({ session, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 text-left transition-colors rounded-lg ${isActive ? 'bg-cyan-100 dark:bg-cyan-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
    >
        <div className="relative shrink-0">
            <img src={session.userAvatar || `https://ui-avatars.com/api/?name=${session.userName}&background=random`} alt={session.userName} className="w-12 h-12 rounded-full object-cover" />
            {session.unreadByListener && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-cyan-500 ring-2 ring-white dark:ring-slate-800" />}
        </div>
        <div className="flex-grow overflow-hidden">
            <div className="flex justify-between items-center">
                <p className={`font-bold truncate ${isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-700 dark:text-slate-300'}`}>{session.userName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{formatSessionTime(session.lastMessageTimestamp)}</p>
            </div>
            <p className={`text-sm truncate ${session.unreadByListener ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                {session.lastMessageText}
            </p>
        </div>
    </button>
);


const ChatScreen: React.FC = () => {
    const { profile } = useListener();
    const [sessions, setSessions] = useState<ListenerChatSession[]>([]);
    const [activeSession, setActiveSession] = useState<ListenerChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { showNotification } = useNotification();
    const { enablePTR, disablePTR } = usePTR();
    const navigate = useNavigate();
    const [isEndingChat, setIsEndingChat] = useState(false);
    const [isStartingCall, setIsStartingCall] = useState(false);

    const handleRefresh = useCallback(async () => {
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
                const sessionsData = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                })) as ListenerChatSession[];
                setSessions(sessionsData);
                setLoading(false);
            }, error => {
                console.error("Error fetching chat sessions:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [profile?.uid]);

    // Fetch messages for the active session
    useEffect(() => {
        if (!activeSession) {
            setMessages([]);
            return;
        }

        setLoadingMessages(true);
        const unsubscribe = db.collection('chats').doc(activeSession.id).collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const messagesData = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                })) as ChatMessage[];
                setMessages(messagesData);
                setLoadingMessages(false);
                
                // Mark messages as read by listener
                if (activeSession.unreadByListener) {
                    db.collection('chats').doc(activeSession.id).update({ unreadByListener: false });
                }
            });

        return () => unsubscribe();
    }, [activeSession]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectSession = (session: ListenerChatSession) => {
        setActiveSession(session);
    };

    const handleSendMessage = async (messageData: Partial<ChatMessage>) => {
        if (!profile || !activeSession) return;

        const message: ChatMessage = {
            id: '', // Will be set by Firestore
            senderId: profile.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
            status: 'sent',
            ...messageData,
        } as ChatMessage;
        
        const sessionRef = db.collection('chats').doc(activeSession.id);
        const messagesRef = sessionRef.collection('messages');

        try {
            await messagesRef.add(message);
            await sessionRef.update({
                lastMessageText: message.type === 'audio' ? '🎤 Voice Message' : message.text,
                lastMessageTimestamp: message.timestamp,
                unreadByUser: true,
                unreadByListener: false,
            });
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification("Failed to send message.", "error");
        }
    };
    
    const handleSendText = (text: string) => {
        handleSendMessage({ text: text.trim(), type: 'text' });
    };

    const handleSendAudio = async (audioBlob: Blob, duration: number) => {
        if (!profile || !activeSession) return;
        const filePath = `chat_audio/${activeSession.id}/${new Date().getTime()}.webm`;
        const storageRef = storage.ref(filePath);
        try {
            const snapshot = await storageRef.put(audioBlob);
            const audioUrl = await snapshot.ref.getDownloadURL();
            handleSendMessage({ audioUrl, duration, text: '', type: 'audio' });
        } catch (error) {
            console.error("Error uploading audio:", error);
            showNotification("Failed to send voice message.", "error");
        }
    };

    const handleEndChat = async () => {
        if (!activeSession || isEndingChat) return;

        if (!window.confirm(`Are you sure you want to end this chat with ${activeSession.userName}? This will close the session and calculate earnings.`)) {
            return;
        }
        
        setIsEndingChat(true);
        try {
            const finalizeChat = functions.httpsCallable('finalizeChatSession');
            await finalizeChat({ chatId: activeSession.id });
            showNotification(`Chat with ${activeSession.userName} has been successfully ended.`, 'success');
            setActiveSession(null);
        } catch (error: any) {
            console.error("Error ending chat:", error);
            showNotification(`Failed to end chat: ${error.message}`, 'error');
        } finally {
            setIsEndingChat(false);
        }
    };
    
    const handleStartCall = async () => {
        if (!profile || !activeSession || isStartingCall) return;

        if (!window.confirm(`Start a call with ${activeSession.userName}?`)) {
            return;
        }

        setIsStartingCall(true);
        showNotification('Initiating call...', 'info');

        try {
            const newCallRef = await db.collection('calls').add({
                listenerId: profile.uid,
                userId: activeSession.userId,
                userName: activeSession.userName,
                userAvatar: activeSession.userAvatar || null,
                startTime: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'ringing',
            });
            navigate(`/call/${newCallRef.id}`);
        } catch (error) {
            console.error("Failed to create call from chat:", error);
            showNotification('Could not start call. Please try again.', 'error');
        } finally {
            setIsStartingCall(false);
        }
    };


    const renderSessionList = () => (
        <div className="h-full overflow-y-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold">Chats</h2>
            </div>
            {loading ? (
                <div className="p-4 text-center">Loading sessions...</div>
            ) : sessions.length > 0 ? (
                 <div className="p-2 space-y-1">
                    {sessions.map(s => <SessionItem key={s.id} session={s} isActive={activeSession?.id === s.id} onClick={() => handleSelectSession(s)} />)}
                </div>
            ) : (
                <div className="p-8 text-center text-slate-500">
                    <p>No active chat sessions.</p>
                </div>
            )}
        </div>
    );

    const renderActiveChat = () => {
        if (!activeSession) {
            return (
                <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <p className="text-lg font-medium">Select a chat to start messaging</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900">
                {/* Header */}
                <header className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveSession(null)} className="md:hidden p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <img src={activeSession.userAvatar || `https://ui-avatars.com/api/?name=${activeSession.userName}`} alt={activeSession.userName} className="w-10 h-10 rounded-full" />
                        <h3 className="font-bold">{activeSession.userName}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleStartCall} disabled={isStartingCall} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Start Call">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </button>
                        <button onClick={handleEndChat} disabled={isEndingChat} className="text-sm bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-lg">
                            {isEndingChat ? 'Ending...' : 'End Chat'}
                        </button>
                    </div>
                </header>
                {/* Messages */}
                <main className="flex-grow overflow-y-auto p-4">
                     {loadingMessages ? (
                        <div className="flex items-center justify-center h-full text-slate-500">Loading messages...</div>
                    ) : (
                        <div>
                            {messages.map(msg => <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.senderId === profile?.uid} />)}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </main>
                {/* Input */}
                <footer className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <ChatInput onSendText={handleSendText} onSendAudio={handleSendAudio} recentMessages={messages.slice(-5)} />
                </footer>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-full">
            <aside className={`h-full border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${activeSession ? 'hidden md:block' : 'block'}`}>
                {renderSessionList()}
            </aside>
            <section className={`h-full md:col-span-2 lg:col-span-3 ${activeSession ? 'block' : 'hidden md:block'}`}>
                {renderActiveChat()}
            </section>
        </div>
    );
};

export default ChatScreen;
