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
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const MIN_SWIPE_DISTANCE = 50; // Minimum horizontal distance for a swipe

  const handleTouchStart = (e: React.TouchEvent) => {
    // Reset coordinates on new touch
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Continuously update the end coordinates
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // To be considered a navigation swipe, the horizontal movement must be:
    // 1. Greater than the minimum swipe distance.
    // 2. Significantly greater than the vertical movement (to avoid conflicts with scrolling).
    // Here, we check if the horizontal distance is at least twice the vertical distance.
    if (absDeltaX > MIN_SWIPE_DISTANCE && absDeltaX > absDeltaY * 2) {
      const currentPath = location.pathname;
      const currentIndex = swipeablePaths.indexOf(currentPath);
      
      // Only handle swipes on the main swipeable screens
      if (currentIndex === -1) {
        return;
      }
      
      if (deltaX < 0) { // Swiped left
        if (currentIndex < swipeablePaths.length - 1) {
          navigate(swipeablePaths[currentIndex + 1]);
        }
      } else { // Swiped right
        if (currentIndex > 0) {
          navigate(swipeablePaths[currentIndex - 1]);
        }
      }
    }
    // If the conditions are not met, we do nothing. This allows the browser's
    // native vertical scrolling to function without interference.
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