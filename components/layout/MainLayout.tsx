import React, { useRef } from 'react';
// FIX: Corrected react-router import. In v6, hooks should be imported from 'react-router-dom'.
import { useLocation, useNavigate } from 'react-router-dom';
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

  const MIN_SWIPE_DISTANCE = 50; // Minimum horizontal distance for a swipe.

  const handleTouchStart = (e: React.TouchEvent) => {
    // Record the starting coordinates of the touch.
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Get the final coordinates when the touch ends.
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // First, determine if the gesture was primarily horizontal or vertical.
    // If vertical movement is greater than horizontal, it's a scroll, so we do nothing.
    if (Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    // If the gesture was horizontal, check if it was long enough to be a swipe.
    if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
      const currentPath = location.pathname;
      const currentIndex = swipeablePaths.indexOf(currentPath);
      
      if (currentIndex === -1) return; // Not a swipeable page
      
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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main 
        className="flex-grow pt-14 pb-16 bg-slate-50 dark:bg-slate-950"
        onTouchStart={handleTouchStart}
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