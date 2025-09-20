import React from 'react';
// FIX: The import for `Link` is correct for react-router-dom v5. The error was a cascading issue from other files using v6 syntax.
import { Link } from 'react-router-dom';
import type { OnboardingData } from '../../screens/auth/OnboardingScreen';

interface ConsentStepProps {
  handleSubmit: () => void;
  prevStep: () => void;
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  isSubmitting: boolean;
}

const ConsentStep: React.FC<ConsentStepProps> = ({ handleSubmit, prevStep, formData, setFormData, isSubmitting }) => {

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
        <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200">अंतिम सहमति</h2>
        
        <div className="mt-8">
            <label htmlFor="terms-agree" className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <input 
                    id="terms-agree"
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={handleCheckboxChange}
                    className="h-6 w-6 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 mt-0.5 flex-shrink-0"
                />
                <span className="text-slate-700 dark:text-slate-300">
                    मैं 
                    <Link to="/terms" target="_blank" className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline mx-1">नियम और शर्तों</Link> 
                    और 
                    <Link to="/privacy" target="_blank" className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline mx-1">गोपनीयता नीति</Link> 
                    से सहमत हूँ।
                </span>
            </label>
        </div>

        <div className="flex items-center gap-4 mt-8">
            <button
                onClick={prevStep}
                disabled={isSubmitting}
                className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-colors"
            >
                वापस
            </button>
            <button
                onClick={handleSubmit}
                disabled={!formData.agreedToTerms || isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-90 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
                {isSubmitting ? 'Submitting...' : 'चलिए शुरू करते हैं!'}
            </button>
        </div>
    </div>
  );
};

export default ConsentStep;