import React, { useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import IncomingCallManager from '../calls/IncomingCallManager';
import Header from '../common/Header';
import { PTRContext } from '../../context/PTRContext';

const swipeablePaths = [
  '/dashboard',
  '/calls',
  '/chat',
  '/earnings',
  '/profile',
];

// --- PTR UI Components ---
const RefreshSpinner = () => (
    <svg className="animate-spin h-6 w-6 text-cyan-600 dark:text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const RefreshArrow: React.FC<{ pullDistance: number }> = ({ pullDistance }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6 text-slate-500 dark:text-slate-400 transition-transform duration-200"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        style={{ transform: `rotate(${Math.min(pullDistance, 70) * 2.5}deg)` }}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M5.293 9.293a1 1 0 011.414 0l.293.293A7.942 7.942 0 0119.5 12a8 8 0 11-8.243-7.743" />
    </svg>
);

const PULL_THRESHOLD = 70;
const PULL_RESISTANCE = 0.6;
const MIN_SWIPE_DISTANCE = 50;

const MainLayout: React.FC<{ children: React.ReactNode; showNav?: boolean }> = ({ children, showNav = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartCoords = useRef({ x: 0, y: 0 });
  const mainRef = useRef<HTMLElement>(null);

  // --- PTR State ---
  const [ptr, setPtr] = useState<{ onRefresh: (() => Promise<any>) | null }>({ onRefresh: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const isDraggingForPTR = useRef(false);

  const ptrContextValue = useMemo(() => ({
      enablePTR: (onRefresh: () => Promise<any>) => setPtr({ onRefresh }),
      disablePTR: () => setPtr({ onRefresh: null }),
  }), []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartCoords.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    if (ptr.onRefresh && mainRef.current?.scrollTop === 0 && !isRefreshing) {
      isDraggingForPTR.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingForPTR.current) return;

    const touchY = e.targetTouches[0].clientY;
    const distance = touchY - touchStartCoords.current.y;
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(distance * PULL_RESISTANCE);
    } else {
      isDraggingForPTR.current = false;
      setPullDistance(0);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStartCoords.current.x;
    const deltaY = touchEnd.clientY - touchStartCoords.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
      const currentPath = location.pathname;
      const currentIndex = swipeablePaths.indexOf(currentPath);
      if (currentIndex > -1) {
        if (deltaX < 0 && currentIndex < swipeablePaths.length - 1) {
          navigate(swipeablePaths[currentIndex + 1]);
        } else if (deltaX > 0 && currentIndex > 0) {
          navigate(swipeablePaths[currentIndex - 1]);
        }
      }
      isDraggingForPTR.current = false;
      setPullDistance(0);
      return;
    }
    
    if (!isDraggingForPTR.current) return;
    
    if (pullDistance >= PULL_THRESHOLD && ptr.onRefresh) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      ptr.onRefresh().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
    isDraggingForPTR.current = false;
  };

  const indicatorStyle = {
    height: '60px',
    marginTop: '-60px',
    transform: `translateY(${pullDistance}px)`,
    transition: isDraggingForPTR.current ? 'none' : 'transform 0.3s ease-out',
  };

  const contentStyle = {
    transform: `translateY(${!isRefreshing ? pullDistance : PULL_THRESHOLD}px)`,
    transition: isDraggingForPTR.current ? 'none' : 'transform 0.3s ease-out',
    minHeight: 'calc(100% + 1px)'
  };

  return (
    <PTRContext.Provider value={ptrContextValue}>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Header />
        <main 
          ref={mainRef}
          className={`flex-grow pt-14 bg-slate-50 dark:bg-slate-950 overflow-y-auto overscroll-contain ${showNav ? 'pb-16' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {ptr.onRefresh && (
            <div style={indicatorStyle} className="flex justify-center items-center" aria-hidden="true">
              {isRefreshing ? <RefreshSpinner /> : <RefreshArrow pullDistance={pullDistance} />}
            </div>
          )}
          <div style={contentStyle}>
            {children}
          </div>
        </main>
        {showNav && <BottomNav />}
        {showNav && <IncomingCallManager />}
      </div>
    </PTRContext.Provider>
  );
};

export default MainLayout;