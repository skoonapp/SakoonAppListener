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
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  
  // This ref is used to lock a gesture as "scrolling" to prevent swipe actions.
  const isScrolling = useRef(false);

  const MIN_SWIPE_DISTANCE = 50; // Minimum horizontal distance for a swipe.
  const GESTURE_AXIS_LOCK_THRESHOLD = 10; // Pixels to move before deciding if it's a scroll or swipe.

  const handleTouchStart = (e: React.TouchEvent) => {
    // Reset coordinates and scroll lock for the new gesture.
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    isScrolling.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If we've already determined this is a vertical scroll, do nothing further.
    // This allows the browser to handle the native scrolling behavior without interference.
    if (isScrolling.current) return;

    // Always update the end X coordinate for the final swipe check.
    touchEndX.current = e.targetTouches[0].clientX;
    
    const deltaX = Math.abs(e.targetTouches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.targetTouches[0].clientY - touchStartY.current);

    // Only decide the gesture's axis after a small initial movement.
    if (deltaX > GESTURE_AXIS_LOCK_THRESHOLD || deltaY > GESTURE_AXIS_LOCK_THRESHOLD) {
      // If vertical movement is greater than horizontal, lock this gesture as a scroll.
      if (deltaY > deltaX) {
        isScrolling.current = true;
      }
    }
  };

  const handleTouchEnd = () => {
    // If the gesture was locked as a vertical scroll, do not attempt to navigate.
    if (isScrolling.current) {
      return;
    }

    const deltaX = touchEndX.current - touchStartX.current;

    // If it wasn't a scroll, check if the horizontal movement was significant enough to be a swipe.
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
      const currentPath = location.pathname;
      const currentIndex = swipeablePaths.indexOf(currentPath);
      
      if (currentIndex === -1) return;
      
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