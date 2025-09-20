import React, { useRef } from 'react';
// FIX: Changed import from 'react-router-dom' to 'react-router' to resolve module export errors for hooks.
import { useLocation, useNavigate } from 'react-router';
import BottomNav from './BottomNav';
import IncomingCallManager from '../calls/IncomingCallManager';
import Header from '../common/Header';

// The order of these paths MUST match the order in BottomNav.tsx for swipe to work correctly.
const swipeablePaths = [
  '/dashboard',
  '/calls',
  '/chat',
  '/earnings',
  '/profile',
];

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeHandled = useRef(false);

  const MIN_SWIPE_DISTANCE = 60; // Minimum distance in pixels for a swipe to be registered

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't interfere with vertical scrolling if it's the primary gesture
    if (e.currentTarget.scrollHeight > e.currentTarget.clientHeight) {
        // Content is scrollable, be more careful
    }
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    swipeHandled.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (swipeHandled.current) return;

    const currentPath = location.pathname;
    const currentIndex = swipeablePaths.indexOf(currentPath);
    
    // Only handle swipes on the main swipeable screens
    if (currentIndex === -1) {
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
      // Swiped left, go to the next screen
      if (currentIndex < swipeablePaths.length - 1) {
        navigate(swipeablePaths[currentIndex + 1]);
        swipeHandled.current = true;
      }
    } else if (isRightSwipe) {
      // Swiped right, go to the previous screen
      if (currentIndex > 0) {
        navigate(swipeablePaths[currentIndex - 1]);
        swipeHandled.current = true;
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Header />
      <main 
        className="flex-grow pt-14 pb-16 overflow-y-auto overscroll-y-contain bg-slate-50 dark:bg-slate-950"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </main>
      <BottomNav />
      <IncomingCallManager />
    </div>
  );
};

export default MainLayout;