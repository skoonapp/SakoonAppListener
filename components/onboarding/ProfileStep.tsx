import React, { useMemo } from 'react';
import type { OnboardingData } from '../../screens/auth/OnboardingScreen';

interface ProfileStepProps {
  nextStep: () => void;
  prevStep: () => void;
  formData: OnboardingData;
  setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>;
}

// Show two specific avatar images for selection as requested.
const AVATAR_IMAGES = [
    'https://listenerimages.netlify.app/images/listener1.webp',
    'https://listenerimages.netlify.app/images/listener2.webp',
];

const ProfileStep: React.FC<ProfileStepProps> = ({ nextStep, prevStep, formData, setFormData }) => {

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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
      <h2 className="text-xl font-bold text-center text-slate-800 dark:text-slate-200">प्रोफ़ाइल पूरी करें</h2>
      
      <div className="mt-6">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">अपनी प्रोफ़ाइल फोटो चुनें</label>
        
        {/* Image Selection */}
        <div className="mt-4 flex justify-center gap-6">
            {AVATAR_IMAGES.map(avatar => (
                <button 
                    key={avatar} 
                    onClick={() => handleSelectAvatar(avatar)}
                    className={`rounded-full focus:outline-none transition-all duration-200 ${formData.selectedAvatar === avatar ? 'ring-4 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-800' : 'ring-2 ring-transparent hover:ring-slate-300'}`}
                >
                    <img src={avatar} alt="Avatar option" className="w-32 h-32 rounded-full border-2 border-white dark:border-slate-700 object-cover" loading="lazy" />
                </button>
            ))}
        </div>
      </div>
      
      <div className="mt-6 space-y-4">
        <div>
            <label htmlFor="city" className="text-sm font-medium text-slate-600 dark:text-slate-400">शहर का नाम</label>
            <input 
                type="text"
                name="city"
                id="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="अपना शहर दर्ज करें"
                className="mt-1 w-full p-3 h-14 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
        </div>
         <div>
            <label htmlFor="age" className="text-sm font-medium text-slate-600 dark:text-slate-400">उम्र</label>
            <input 
                type="number"
                name="age"
                id="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="अपनी उम्र दर्ज करें (e.g., 25)"
                className="mt-1 w-full p-3 h-14 bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button
            onClick={prevStep}
            className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-colors"
        >
            वापस
        </button>
        <button
            onClick={nextStep}
            disabled={!isFormValid}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors"
        >
            आगे बढ़ें
        </button>
      </div>
    </div>
  );
};

export default ProfileStep;