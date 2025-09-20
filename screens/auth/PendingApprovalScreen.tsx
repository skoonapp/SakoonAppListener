import React from 'react';
import { auth } from '../../utils/firebase';
import { useNotification } from '../../context/NotificationContext';

const PendingApprovalScreen: React.FC = () => {
  const { showNotification } = useNotification();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // The main App router will handle redirecting to the login screen.
    } catch (error) {
      console.error('Error signing out: ', error);
      showNotification('Could not log out. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-center">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/50">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Application Submitted</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Thank you for completing your profile. Your application is now under review by our team.
        </p>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          You will be notified once it has been approved. This usually takes 24-48 hours.
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default PendingApprovalScreen;
