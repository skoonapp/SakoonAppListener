import React from 'react';
import type { ListenerProfile } from '../../types';

interface WelcomeStepProps {
  nextStep: () => void;
  userData: ListenerProfile | null;
}

const InfoField: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="mt-4">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            {icon}
            {label}
        </label>
        <div className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-lg p-3 mt-1 font-mono text-sm">
            {value}
        </div>
    </div>
);


const WelcomeStep: React.FC<WelcomeStepProps> = ({ nextStep, userData }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
        <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/50">
                <span className="text-4xl">🖐</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">नमस्ते, {userData?.realName || 'Listener'}!</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
                SakoonApp में आपका स्वागत है! शुरू करने से पहले, कृपया अपनी जानकारी की पुष्टि करें।
            </p>
        </div>

        <div className="mt-6">
            <InfoField 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
                label="पूरा नाम"
                value={userData?.realName || 'Loading...'}
            />
            <InfoField 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}
                label="बैंक खाता संख्या"
                value={userData?.bankAccount || 'Not Provided'}
            />
             <InfoField 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>}
                label="UPI ID"
                value={userData?.upiId || 'Not Provided'}
            />
        </div>
        
        <button
            onClick={nextStep}
            disabled={!userData}
            className="mt-8 w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
            आगे बढ़ें
        </button>
    </div>
  );
};

export default WelcomeStep;