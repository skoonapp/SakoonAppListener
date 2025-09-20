import React from 'react';

interface RulesStepProps {
  nextStep: () => void;
  prevStep: () => void;
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


const RulesStep: React.FC<RulesStepProps> = ({ nextStep, prevStep }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
        <div className="text-center">
             <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">नियम और शर्तें</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400">कृपया ध्यान से पढ़ें</p>
        </div>
       
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg max-h-80 overflow-y-auto">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                ⭐ सबसे ज़रूरी बातें
            </h3>
            
            <RuleSection title="हमेशा करें:" icon="✅" color="text-green-500">
                <li>🤝 User की इज़्ज़त करें</li>
                <li>💬 अच्छे से बात करें</li>  
                <li>📋 नियमों का पालन करें</li>
            </RuleSection>

            <RuleSection title="कभी न करें:" icon="❌" color="text-red-500">
                <li>📱 Personal जानकारी शेयर न करें</li>
                <li>🚫 गलत भाषा का इस्तेमाल न करें</li>
                <li>⏹ कॉल/चैट बीच में न काटें</li>
            </RuleSection>
            
            <RuleSection title="पेमेंट नियम:" icon="💰" color="text-yellow-500">
                <li>📅 हर सोमवार को पेमेंट</li>
                <li>💵 Minimum: ₹699</li>
                <li>⚠ नियम तोड़ने पर 20% पेनल्टी</li>
            </RuleSection>

            <div className="mt-6 p-3 bg-cyan-50 dark:bg-cyan-900/40 rounded-lg border border-cyan-200 dark:border-cyan-800">
                 <h4 className="text-md font-bold flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
                    🎧 Listeners के लिए ज़रूरी बातें
                </h4>
                <ul className="list-none mt-2 space-y-1 text-sm text-cyan-700 dark:text-cyan-300">
                    <li>🔐 <strong>Privacy:</strong> आपकी पहचान सुरक्षित है</li>
                    <li>💳 <strong>Security:</strong> पेमेंट जानकारी एन्क्रिप्टेड है</li>  
                    <li>⚠ <strong>Warning:</strong> Personal जानकारी शेयर करना = अकाउंट सस्पेंड</li>
                </ul>
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
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
                मैं समझ गया/गई
            </button>
        </div>
    </div>
  );
};

export default RulesStep;