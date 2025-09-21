import React, { useState, useEffect, lazy, Suspense } from 'react';
// FIX: Split react-router-dom imports to resolve export errors. Core components are now imported from 'react-router' and DOM-specific components from 'react-router-dom'.
import { Routes, Route, Navigate } from 'react-router';
import { HashRouter } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, db } from './utils/firebase';

import LoginScreen from './screens/auth/LoginScreen';
import MainLayout from './components/layout/MainLayout';
import SplashScreen from './components/common/SplashScreen';
import { ListenerProvider } from './context/ListenerContext';
import type { ListenerProfile } from './types';
import { NotificationProvider } from './context/NotificationContext';

// Lazy load all screens
const DashboardScreen = lazy(() => import('./screens/listener/DashboardScreen'));
const CallsScreen = lazy(() => import('./screens/listener/CallsScreen'));
const ChatScreen = lazy(() => import('./screens/listener/ChatScreen'));
const EarningsScreen = lazy(() => import('./screens/listener/EarningsScreen'));
const ProfileScreen = lazy(() => import('./screens/listener/ProfileScreen'));
const ActiveCallScreen = lazy(() => import('./screens/listener/ActiveCallScreen'));
const TermsScreen = lazy(() => import('./screens/listener/TermsScreen'));
const PrivacyPolicyScreen = lazy(() => import('./screens/listener/PrivacyPolicyScreen'));
const OnboardingScreen = lazy(() => import('./screens/auth/OnboardingScreen'));
const PendingApprovalScreen = lazy(() => import('./screens/auth/PendingApprovalScreen'));
const AdminDashboardScreen = lazy(() => import('./screens/admin/AdminDashboardScreen'));
const ListenerManagementScreen = lazy(() => import('./screens/admin/ListenerManagementScreen'));
const UnauthorizedScreen = lazy(() => import('./screens/auth/UnauthorizedScreen'));

type AuthStatus = 'loading' | 'unauthenticated' | 'needs_onboarding' | 'pending_approval' | 'active' | 'admin' | 'unauthorized';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // --- Priority 1: Check for secure custom admin claim on the token ---
          const idTokenResult = await firebaseUser.getIdTokenResult();
          if (idTokenResult.claims.admin === true) {
            setAuthStatus('admin');
            return; // Exit early, this is the highest level of authorization.
          }

          // --- Priority 2: Fallback to checking the Firestore document ---
          const listenerRef = db.collection('listeners').doc(firebaseUser.uid);
          const doc = await listenerRef.get();
          
          if (doc.exists) {
            const data = doc.data() as ListenerProfile;

            // This check remains as a fallback or for admins set via Firestore.
            if (data.isAdmin === true) {
              setAuthStatus('admin');
              return;
            }

            // If the user is not an admin, proceed with standard listener status checks.
            switch (data.status) {
              case 'onboarding_required':
                setAuthStatus('needs_onboarding');
                break;
              case 'pending':
                setAuthStatus('pending_approval');
                break;
              case 'active':
                setAuthStatus('active');
                break;
              default:
                // Any other status (e.g., 'suspended', 'rejected') leads to unauthorized access.
                console.warn(`User ${firebaseUser.uid} has an unhandled or rejected status: ${data.status}`);
                setAuthStatus('unauthorized');
            }
          } else {
            // If an auth user exists but has no listener doc, they are unauthorized.
            console.warn(`No listener document found for authenticated user ${firebaseUser.uid}.`);
            setAuthStatus('unauthorized');
          }
        } catch (error) {
            console.error("Error checking listener status:", error);
            setAuthStatus('unauthorized');
        }
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    });
    return () => unsubscribe();
  }, []);

  if (authStatus === 'loading') {
    return <SplashScreen />;
  }
  
  // This handles the cases where auth state is determined but the user object might be null temporarily.
  if ((authStatus === 'active' || authStatus === 'needs_onboarding') && !user) {
      return <SplashScreen />;
  }

  const routeContent = (
    <Suspense fallback={<SplashScreen />}>
      <Routes>
          {authStatus === 'unauthenticated' && <>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
          </>}
          {authStatus === 'needs_onboarding' && user && <>
              <Route path="/onboarding" element={<OnboardingScreen user={user} />} />
              <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </>}
          {authStatus === 'pending_approval' && <>
              <Route path="/pending-approval" element={<PendingApprovalScreen />} />
              <Route path="*" element={<Navigate to="/pending-approval" replace />} />
          </>}
          {authStatus === 'admin' && <>
              <Route path="/admin/listeners" element={<ListenerManagementScreen />} />
              <Route path="/admin" element={<AdminDashboardScreen />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
          </>}
          {authStatus === 'unauthorized' && <>
              <Route path="/unauthorized" element={<UnauthorizedScreen />} />
              <Route path="*" element={<Navigate to="/unauthorized" replace />} />
          </>}
          {authStatus === 'active' && user && (
              <>
                  <Route path="/call/:callId" element={<ActiveCallScreen />} />
                  <Route path="/dashboard" element={<MainLayout><DashboardScreen /></MainLayout>} />
                  <Route path="/calls" element={<MainLayout><CallsScreen /></MainLayout>} />
                  <Route path="/chat" element={<MainLayout><ChatScreen /></MainLayout>} />
                  <Route path="/earnings" element={<MainLayout><EarningsScreen /></MainLayout>} />
                  <Route path="/profile" element={<MainLayout><ProfileScreen /></MainLayout>} />
                  <Route path="/terms" element={<MainLayout><TermsScreen /></MainLayout>} />
                  <Route path="/privacy" element={<MainLayout><PrivacyPolicyScreen /></MainLayout>} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
          )}
           {/* Fallback for unhandled statuses or when conditions are not met */}
           <Route path="*" element={<SplashScreen />} />
      </Routes>
    </Suspense>
  );

  return (
    <NotificationProvider>
      <HashRouter>
        {user ? (
          <ListenerProvider user={user}>
            {routeContent}
          </ListenerProvider>
        ) : (
          routeContent
        )}
      </HashRouter>
    </NotificationProvider>
  );
};

export default App;