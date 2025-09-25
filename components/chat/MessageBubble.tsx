import React from 'react';
import type { ChatMessage } from '../../types';
import AudioPlayer from './AudioPlayer';
import { filterInappropriateContent } from '../../utils/chatSecurity';


interface MessageBubbleProps {
    message: ChatMessage;
    isOwnMessage: boolean;
}

// --- Status Ticks Icon ---
const StatusTicks: React.FC<{ status: ChatMessage['status'] }> = ({ status }) => {
    const isRead = status === 'read';
    const tickColor = isRead ? 'text-blue-500' : 'text-slate-400';

    if (status === 'sent') {
        return <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${tickColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
    }

    return (
        <div className="relative w-4 h-4">
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 absolute -left-1.5 ${tickColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 absolute ${tickColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
    );
};

const formatTimestamp = (timestamp: any): string => {
    if (!timestamp || !timestamp.toDate) return '';
    return timestamp.toDate().toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).toLowerCase();
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
    const bubbleClasses = isOwnMessage
        ? 'bg-user-chat-bubble dark:bg-teal-900 rounded-br-none text-slate-800'
        : 'bg-white dark:bg-slate-700 rounded-bl-none';

    const renderContent = () => {
        if (message.type === 'audio' && message.audioUrl) {
            return <AudioPlayer audioUrl={message.audioUrl} duration={message.duration || 0} />;
        }
        // Sanitize the text content before displaying it, especially for incoming messages.
        const sanitizedText = isOwnMessage ? message.text : filterInappropriateContent(message.text);
        return <p className="whitespace-pre-wrap break-words">{sanitizedText}</p>;
    };

    return (
        <div className={`flex my-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-2.5 rounded-xl shadow-sm ${bubbleClasses}`}>
                {renderContent()}
                <div className="flex justify-end items-center mt-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
                        {formatTimestamp(message.timestamp)}
                    </span>
                    {isOwnMessage && <StatusTicks status={message.status} />}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;