import React from 'react';
// FIX: Corrected react-router imports. In v6, hooks and components should be imported from 'react-router-dom'.
import { useResolvedPath, useMatch, Link } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: (active: boolean) => <IconDashboard active={active} /> },
  { path: '/calls', label: 'Calls', icon: (active: boolean) => <IconCalls active={active} /> },
  { path: '/chat', label: 'Chat', icon: (active: boolean) => <IconChat active={active} /> },
  { path: '/earnings', label: 'Earnings', icon: (active: boolean) => <IconEarnings active={active} /> },
  { path: '/profile', label: 'Profile', icon: (active: boolean) => <IconProfile active={active} /> },
];

const NavItem: React.FC<{ path: string; label: string; icon: (active: boolean) => React.ReactNode; }> = ({ path, label, icon }) => {
    const resolved = useResolvedPath(path);
    const match = useMatch({ path: resolved.pathname, end: true });
    const isActive = !!match;

    const textColor = isActive 
        ? 'text-slate-800 dark:text-emerald-200' 
        : 'text-slate-500 dark:text-slate-400';
    
    const labelStyle = isActive 
        ? 'text-sm font-bold' 
        : 'text-xs';

    return (
        <Link to={path} aria-label={label} className="flex-1 flex flex-col justify-center items-center h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg group">
            <div className={`relative px-4 py-1 rounded-full transition-colors duration-300 ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-transparent'}`}>
                <div className={`transition-transform duration-200 ease-in-out ${isActive ? '-translate-y-0.5' : ''} ${textColor} group-hover:text-slate-800 dark:group-hover:text-slate-200`}>
                     {icon(isActive)}
                </div>
            </div>
            <span className={`transition-all duration-200 ${labelStyle} ${textColor} group-hover:text-slate-800 dark:group-hover:text-slate-200`}>{label}</span>
        </Link>
    );
};


const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-white to-primary-50 dark:from-deep-slate dark:to-cyan-950/40 shadow-[0_-2px_15px_-5px_rgba(0,0,0,0.2)] border-t border-slate-200/80 dark:border-white/10 z-50">
      <div className="flex justify-around h-full">
        {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
        ))}
      </div>
    </nav>
  );
};

// SVG Icon Components
const IconDashboard: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);
const IconCalls: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const IconChat: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
);
const IconEarnings: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
const IconProfile: React.FC<{ active: boolean }> = ({ active }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);


export default BottomNav;