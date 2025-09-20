import React from 'react';
import { auth } from '../../utils/firebase';

const UnauthorizedScreen: React.FC = () => {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      // The main App router will handle redirecting to the login screen.
    } catch (error) {
      console.error('Error signing out: ', error);
      alert('Could not log out. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-center">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Access Denied</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Your phone number is registered, but your account has not been approved or authorized for the Sakoon Listener app.
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          If you have recently applied, please wait for approval. Otherwise, please contact support.
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedScreen;