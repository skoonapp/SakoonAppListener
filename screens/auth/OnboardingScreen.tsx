import React, { useState, useEffect } from 'react';
// FIX: Changed import from 'react-router-dom' to 'react-router' to resolve module export errors for hooks.
import { useNavigate } from 'react-router';
import firebase from 'firebase/compat/app';
import { db } from '../../utils/firebase';
import type { ListenerProfile } from '../../types';

import OnboardingStepOne from '../../components/onboarding/OnboardingStepOne';
import OnboardingStepTwo from '../../components/onboarding/OnboardingStepTwo';
import StepProgress from '../../components/onboarding/StepProgress';

interface OnboardingScreenProps {
  user: firebase.User;
}

export interface OnboardingData {
  selectedAvatar: string;
  city: string;
  age: string;
  agreedToTerms: boolean;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [listenerData, setListenerData] = useState<ListenerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OnboardingData>({
    selectedAvatar: '',
    city: '',
    age: '',
    agreedToTerms: false,
  });

  useEffect(() => {
    const fetchListenerData = async () => {
      try {
        const docRef = db.collection('listeners').doc(user.uid);
        const doc = await docRef.get();
        if (doc.exists) {
          setListenerData(doc.data() as ListenerProfile);
        } else {
          setError('Your partially approved profile was not found. Please contact support.');
        }
      } catch (err) {
        console.error("Error fetching listener data:", err);
        setError('Could not load your information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchListenerData();
  }, [user.uid]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Upon completing onboarding, update the profile details and, crucially,
      // set the status to 'pending' for final admin review.
      const listenerUpdate = {
        avatarUrl: formData.selectedAvatar,
        city: formData.city,
        age: parseInt(formData.age, 10),
        onboardingComplete: true,
        status: 'pending', // This is the key change to fix the loop.
      };

      await db.collection('listeners').doc(user.uid).update(listenerUpdate);
      
      // The router in App.tsx will now pick up the 'pending' status and show the correct screen.
      // We don't need to navigate here, as the state change in App.tsx will handle it.
      // However, a direct navigate provides a faster user experience.
      navigate('/pending-approval', { replace: true });

    } catch (err) {
      console.error("Failed to submit onboarding data:", err);
      setError('An error occurred during submission. Please try again.');
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <OnboardingStepOne nextStep={nextStep} userData={listenerData} formData={formData} setFormData={setFormData} />;
      case 2:
        return <OnboardingStepTwo handleSubmit={handleSubmit} prevStep={prevStep} formData={formData} setFormData={setFormData} isSubmitting={loading} />;
      default:
        return <div>Unknown step</div>;
    }
  };
  
  const totalSteps = 2; // Updated from 4 to 2

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg mx-auto"> {/* Increased max-w for better layout */}
            <header className="text-center mb-4">
                <h1 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">SakoonApp</h1>
                <p className="text-slate-500 dark:text-slate-400">Listener Onboarding</p>
            </header>
            
            <StepProgress currentStep={step} totalSteps={totalSteps} />

            <main className="mt-4">
                {loading && step === 1 && (
                    <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                        <svg className="animate-spin h-8 w-8 text-cyan-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-4 text-slate-500 dark:text-slate-400">Loading your details...</p>
                    </div>
                )}
                {error && <div className="text-center p-4 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-lg">{error}</div>}
                {!loading && !error && renderStep()}
            </main>
        </div>
    </div>
  );
};

export default OnboardingScreen;