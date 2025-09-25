import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
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

// This new component wraps all authenticated routes under a single, persistent ListenerProvider.
// This prevents the provider from unmounting during navigation, which was the root cause of the
// online status flickering and incorrect counts on the admin dashboard.
const AuthenticatedApp: React.FC<{ user: firebase.User; authStatus: AuthStatus }> = ({ user, authStatus }) => (
  <ListenerProvider user={user}>
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        {authStatus === 'needs_onboarding' && <>
          <Route path="/onboarding" element={<OnboardingScreen user={user} />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </>}
        {authStatus === 'pending_approval' && <>
          <Route path="/pending-approval" element={<PendingApprovalScreen />} />
          <Route path="*" element={<Navigate to="/pending-approval" replace />} />
        </>}
        {authStatus === 'admin' && <>
          <Route path="/admin/listeners" element={<MainLayout showNav={false}><ListenerManagementScreen /></MainLayout>} />
          <Route path="/admin" element={<MainLayout showNav={false}><AdminDashboardScreen /></MainLayout>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </>}
        {authStatus === 'unauthorized' && <>
          <Route path="/unauthorized" element={<UnauthorizedScreen />} />
          <Route path="*" element={<Navigate to="/unauthorized" replace />} />
        </>}
        {authStatus === 'active' && (
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
        {/* Fallback for any unhandled authenticated status */}
        <Route path="*" element={<SplashScreen />} />
      </Routes>
    </Suspense>
  </ListenerProvider>
);

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const prevUserRef = useRef<firebase.User | null>(null);

  useEffect(() => {
    // This effect runs when the user object changes to handle logout cleanup.
    const prevUser = prevUserRef.current;
    if (prevUser && !user) { // A user was logged in, but now is not.
        console.log(`User ${prevUser.uid} logged out. Setting status to offline.`);
        // Set their status to offline on clean logout.
        db.collection('listeners').doc(prevUser.uid).update({
            appStatus: 'Offline',
            isOnline: false, // Also update isOnline if the field is still in use.
        }).catch(err => {
            console.error("Failed to update listener status on logout:", err);
        });
    }
    // Update the ref for the next render.
    prevUserRef.current = user;
  }, [user]);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          if (idTokenResult.claims.admin === true) {
            setAuthStatus('admin');
            return;
          }

          const listenerRef = db.collection('listeners').doc(firebaseUser.uid);
          const doc = await listenerRef.get();
          
          if (doc.exists) {
            const data = doc.data() as ListenerProfile;

            if (data.isAdmin === true) {
              setAuthStatus('admin');
              return;
            }

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
                console.warn(`User ${firebaseUser.uid} has an unhandled or rejected status: ${data.status}`);
                setAuthStatus('unauthorized');
            }
          } else {
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

  return (
    <NotificationProvider>
      <HashRouter>
        {authStatus === 'unauthenticated' ? (
          <Suspense fallback={<SplashScreen />}>
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        ) : user ? (
          // Once authenticated, render the AuthenticatedApp which handles its own routing.
          // The 'user' check ensures ListenerProvider receives a valid user object.
          <AuthenticatedApp user={user} authStatus={authStatus} />
        ) : (
          // This handles the brief moment between auth status changing and the user object becoming available.
          <SplashScreen />
        )}
      </HashRouter>
    </NotificationProvider>
  );
};

export default App;