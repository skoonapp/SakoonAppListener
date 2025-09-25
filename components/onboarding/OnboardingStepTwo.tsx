import React from 'react';
// FIX: The import for `Link` is correct for react-router-dom v5. The error was a cascading issue from other files using v6 syntax.
import { Link } from 'react-router-dom';
import type { OnboardingData } from '../../screens/auth/OnboardingScreen';

interface OnboardingStepTwoProps {
  handleSubmit: () => void;
  prevStep: () => void;
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  isSubmitting: boolean;
}

const RuleSection: React.FC<{ title: string; icon: string; color: string; children: React.ReactNode; }> = ({ title, icon, color, children }) => (
    <div className="mt-4">
        <h4 className="text-md font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <span className={`text-xl ${color}`}>{icon}</span>
            {title}
        </h4>
        <ul className="list-disc list-outside pl-8 mt-2 space-y-1 text-slate-600 dark:text-slate-400">
            {children}
        </ul>
    </div>
);

const OnboardingStepTwo: React.FC<OnboardingStepTwoProps> = ({ handleSubmit, prevStep, formData, setFormData, isSubmitting }) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in space-y-6">
        <div className="text-center">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Rules & Final Consent</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">Please read carefully before submitting.</p>
        </div>
       
        {/* Rules Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg max-h-64 overflow-y-auto">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                ⭐ Key Points
            </h3>
            <RuleSection title="Do's:" icon="✅" color="text-green-500">
                <li>🤝 Respect the user</li>
                <li>💬 Communicate clearly</li>  
                <li>📋 Follow all policies</li>
            </RuleSection>
            <RuleSection title="Don'ts:" icon="❌" color="text-red-500">
                <li>📱 Share personal info</li>
                <li>🚫 Use abusive language</li>
                <li>⏹ End calls/chats abruptly</li>
            </RuleSection>
            <RuleSection title="Payments:" icon="💰" color="text-yellow-500">
                <li>📅 Payouts every Monday</li>
                <li>💵 Minimum: ₹699</li>
                <li>⚠ 20% penalty for violations</li>
            </RuleSection>
        </div>

        {/* Consent Section */}
        <div>
            <label htmlFor="terms-agree" className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <input 
                    id="terms-agree"
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={handleCheckboxChange}
                    className="h-6 w-6 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 mt-0.5 flex-shrink-0"
                />
                <span className="text-slate-700 dark:text-slate-300">
                    I agree to the 
                    <Link to="/terms" target="_blank" className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline mx-1">Terms & Conditions</Link> 
                    and 
                    <Link to="/privacy" target="_blank" className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline mx-1">Privacy Policy</Link>.
                </span>
            </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-2">
            <button
                onClick={prevStep}
                disabled={isSubmitting}
                className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-colors"
            >
                Back
            </button>
            <button
                onClick={handleSubmit}
                disabled={!formData.agreedToTerms || isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:opacity-90 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
                {isSubmitting ? 'Submitting...' : 'Let\'s Get Started!'}
            </button>
        </div>
    </div>
  );
};

export default OnboardingStepTwo;