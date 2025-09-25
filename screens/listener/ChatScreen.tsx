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
        setLoading(