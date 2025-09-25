import React, { useState, useEffect } from 'react';
import { useListener } from '../../context/ListenerContext';
import { db } from '../../utils/firebase';

// --- Icon Components ---
const SunIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.106a.75.75 0 010 1.06l-1.591 1.59a.75.75 0 11-1.06-1.06l1.59-1.59a.75.75 0 011.06 0zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.803 17.803a.75.75 0 01-1.06 0l-1.59-1.591a.75.75 0 111.06-1.06l1.59 1.59a.75.75 0 010 1.06zM12 21a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75-.75zM4.496 6.106a.75.75 0 011.06 0l1.59 1.59a.75.75 0 01-1.06 1.06L4.495 7.166a.75.75 0 010-1.06zM3 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3.75A.75.75 0 013 12zM6.107 17.803a.75.75 0 010-1.06l1.59-1.59a.75.75 0 111.06 1.06l-1.59 1.591a.75.75 0 01-1.06 0z" />
    </svg>
);

const MoonIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-3.51 1.713-6.625 4.332-8.518a.75.75 0 01.819.162z" clipRule="evenodd" />
    </svg>
);

const BellIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 2a6 6 0 00-6 6v3.586l-1.293 1.293a1 1 0 00.707 1.707h13.172a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
);

const Header: React.FC = () => {
    const { profile } = useListener();
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.theme = isDarkMode ? 'dark' : 'light';
    }, [isDarkMode]);

    useEffect(() => {
        if (!profile?.uid) return;
        const query = db.collection('listeners').doc(profile.uid).collection('notifications').where('read', '==', false);
        const unsubscribe = query.onSnapshot(snapshot => {
            setUnreadCount(snapshot.size);
        });
        return () => unsubscribe();
    }, [profile?.uid]);
    
    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-white to-primary-50 dark:from-deep-slate dark:to-cyan-950/40 shadow-md z-50 flex items-center justify-between px-4">
            <div className="text-2xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-cyan-600 to-teal-500 bg-clip-text text-transparent dark:from-cyan-400 dark:to-teal-300">
                    Sakoon
                </span>
                <span className="text-indigo-500 dark:text-indigo-300">
                    App
                </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative">
                    <button
                        className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 dark:text-cyan-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors relative"
                        aria-label="View notifications"
                    >
                        <BellIcon className="w-6 h-6" />
                        {unreadCount > 0 && (
                           <span className="absolute top-2 right-2 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                </div>
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 dark:text-cyan-200 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                </button>
            </div>
        </header>
    );
};

export default Header;