import React, { useMemo } from 'react';
import type { ListenerProfile } from '../../types';
import type { OnboardingData } from '../../screens/auth/OnboardingScreen';

interface OnboardingStepOneProps {
  nextStep: () => void;
  userData: ListenerProfile | null;
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
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

const AVATAR_IMAGES = [
    'https://listenerimages.netlify.app/images/listener1.webp',
    'https://listenerimages.netlify.app/images/listener2.webp',
];

const OnboardingStepOne: React.FC<OnboardingStepOneProps> = ({ nextStep, userData, formData, setFormData }) => {
  const isFormValid = useMemo(() => {
    const ageNum = parseInt(formData.age, 10);
    return formData.selectedAvatar && formData.city.trim().length > 2 && !isNaN(ageNum) && ageNum >= 18 && ageNum <= 100;
  }, [formData]);

  const handleSelectAvatar = (url: string) => {
    setFormData(prev => ({ ...prev, selectedAvatar: url }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in space-y-6">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">नमस्ते, {userData?.realName || 'Listener'}!</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
                Welcome to SakoonApp! Please confirm your details and complete your profile to continue.
            </p>
        </div>

        {/* User Details Confirmation */}
        <div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Your Details</h3>
            <InfoField 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
                label="Full Name (for records)"
                value={userData?.realName || 'Loading...'}
            />
            <InfoField 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>}
                label="Payment Details (Bank A/C or UPI)"
                value={userData?.bankAccount || userData?.upiId || 'Not Provided'}
            />
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        {/* Profile Completion */}
        <div>
             <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Complete Your Profile</h3>
            <div className="mt-4">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Select your profile picture</label>
                <div className="mt-2 flex justify-center gap-6">
                    {AVATAR_IMAGES.map(avatar => (
                        <button 
                            key={avatar} 
                            onClick={() => handleSelectAvatar(avatar)}
                            className={`rounded-full focus:outline-none transition-all duration-200 ${formData.selectedAvatar === avatar ? 'ring-4 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800' : 'ring-2 ring-transparent hover:ring-slate-300'}`}
                        >
                            <img src={avatar} alt="Avatar option" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white dark:border-slate-700 object-cover" loading="lazy" />
                        </button>
                    ))}
                </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="city" className="text-sm font-medium text-slate-600 dark:text-slate-400">City Name</label>
                    <input 
                        type="text" name="city" id="city" value={formData.city} onChange={handleChange}
                        placeholder="Enter your city"
                        className="mt-1 w-full p-3 h-12 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
                <div>
                    <label htmlFor="age" className="text-sm font-medium text-slate-600 dark:text-slate-400">Age</label>
                    <input 
                        type="number" name="age" id="age" value={formData.age} onChange={handleChange}
                        placeholder="e.g., 25"
                        className="mt-1 w-full p-3 h-12 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>
            </div>
        </div>

        <div className="mt-6">
            <button
                onClick={nextStep}
                disabled={!isFormValid}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
                Next
            </button>
        </div>
    </div>
  );
};

export default OnboardingStepOne;