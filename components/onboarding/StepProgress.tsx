import React from 'react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <div
            key={step}
            className={`h-2.5 flex-1 rounded-full transition-all duration-500 ease-in-out 
              ${isCurrent ? 'bg-cyan-500' : isCompleted ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          />
        );
      })}
    </div>
  );
};

export default StepProgress;