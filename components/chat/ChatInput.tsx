import React, { useState, useRef, useEffect } from 'react';
import { FORBIDDEN_CONTENT_PATTERN } from '../../utils/chatSecurity';
import type { ChatMessage } from '../../types';
import { useNotification } from '../../context/NotificationContext';

// --- Icons ---
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.579h4.232a.75.75 0 010 1.5H4.643a.75.75 0 00-.95.579l-1.414 4.949a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
    </svg>
);
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
        <path d="M5.5 8.5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V9a.5.5 0 01.5-.5z" />
        <path d="M12.5 8.5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V9a.5.5 0 01.5-.5z" />
        <path d="M10 18a.5.5 0 00.5-.5v-1.121a5.002 5.002 0 00-5 0V17.5a.5.5 0 00.5.5h4z" />
    </svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
);


interface ChatInputProps {
    onSendText: (text: string) => void;
    onSendAudio: (audioBlob: Blob, duration: number) => void;
    recentMessages: ChatMessage[];
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendText, onSendAudio, recentMessages }) => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [validationError, setValidationError] = useState<string | null>(null);
    const { showNotification } = useNotification();
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingTimerRef = useRef<number | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea height
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [text]);

    // Cleanup effect for timers and media streams to prevent memory leaks
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                mediaRecorderRef.current.stop();
            }
        };
    }, []);


    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        if (validationError) {
            setValidationError(null);
        }
    };
    
    const triggerValidationError = (message: string) => {
        setValidationError(message);
        setTimeout(() => setValidationError(null), 3500);
    };

    // Advanced validation logic
    const validateAndSend = () => {
        const currentText = text.trim();
        if (!currentText) return;

        // Reset the regex index to avoid issues with the 'g' flag
        FORBIDDEN_CONTENT_PATTERN.lastIndex = 0;

        // Check 1: Standard forbidden content in the current message
        if (FORBIDDEN_CONTENT_PATTERN.test(currentText)) {
            triggerValidationError("Sending links, numbers, or inappropriate language is not allowed.");
            return;
        }

        // Check 2: Advanced check for fragmented phone numbers across recent messages
        const combinedText = [...recentMessages.map(m => m.text), currentText].join(' ');
        const digitsOnly = combinedText.replace(/\D/g, '');
        if (/\d{7,}/.test(digitsOnly)) {
            triggerValidationError("Sending phone numbers, even in parts, is not allowed.");
            return;
        }

        // If all checks pass
        onSendText(currentText);
        setText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            validateAndSend();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (recordingTime > 0.5) { // Only send if recording is longer than half a second
                   onSendAudio(audioBlob, recordingTime);
                }
                stream.getTracks().forEach(track => track.stop()); // Release microphone
            };
            
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Microphone access denied:", error);
            showNotification("Microphone access is required to send voice messages.", "error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
        }
        setIsRecording(false);
    };

    const formatRecordingTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div className="flex items-end gap-2">
             <div className="flex-grow bg-white dark:bg-slate-700 rounded-2xl border border-slate-300 dark:border-slate-600 flex items-end p-1 relative">
                {isRecording ? (
                     <div className="w-full flex items-center justify-between p-2">
                        <div className="flex items-center gap-2 text-red-500">
                             <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                             <span>{formatRecordingTime(recordingTime)}</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">Release to send</div>
                     </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-grow bg-transparent focus:outline-none p-2 resize-none max-h-32"
                    />
                )}
                 {validationError && (
                     <div className="absolute bottom-full left-0 w-full p-2 mb-1 text-xs text-center text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-md animate-fade-in">
                         {validationError}
                     </div>
                 )}
            </div>
            {text.trim() ? (
                <button onClick={validateAndSend} className="w-12 h-12 flex-shrink-0 bg-cyan-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110">
                    <SendIcon className="w-6 h-6" />
                </button>
            ) : (
                <button
                    onMouseDown={startRecording}
                    onMouseUp={() => stopRecording()}
                    onTouchStart={startRecording}
                    onTouchEnd={() => stopRecording()}
                    className="w-12 h-12 flex-shrink-0 bg-cyan-600 text-white rounded-full flex items-center justify-center transition-transform active:scale-125"
                >
                    {isRecording ? <TrashIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                </button>
            )}
        </div>
    );
};

export default ChatInput;