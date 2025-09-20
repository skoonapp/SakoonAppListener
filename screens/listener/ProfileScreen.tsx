import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../utils/firebase';
import { useNavigate } from 'react-router-dom';
import { GuidelinesContent } from '../../components/profile/ListenerGuidelines';
import { useListener } from '../../context/ListenerContext';
import { TermsContent } from './TermsScreen';
import { PrivacyPolicyContent } from './PrivacyPolicyScreen';

// --- Reusable Notification Banner ---
const NotificationBanner: React.FC<{ message: string; type: 'error' | 'success'; onDismiss: () => void; }> = ({ message, type, onDismiss }) => {
    const baseClasses = "p-4 mb-3 rounded-lg flex items-center justify-between shadow-md animate-fade-in";
    const colorClasses = type === 'error'
        ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
        : "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200";

    return (
        <div className={`${baseClasses} ${colorClasses}`} role="alert">
            <p className="font-medium">{message}</p>
            <button onClick={onDismiss} aria-label="Dismiss" className="p-1 -mr-2 rounded-full hover:bg-black/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};


// --- Reusable Accordion Component ---
const ChevronDownIcon: React.FC<{ isOpen: boolean; className?: string }> = ({ isOpen, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const Accordion: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void; }> = ({ title, children, isOpen, onToggle }) => {
    return (
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center text-left p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg"
                aria-expanded={isOpen}
            >
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                <ChevronDownIcon isOpen={isOpen} className="text-slate-500 dark:text-slate-400" />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px]' : 'max-h-0'}`}>
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 md:p-6 prose prose-slate dark:prose-invert max-w-4xl mx-auto">
                   {children}
                </div>
            </div>
        </div>
    );
};


const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; }> = ({ checked, onChange, disabled }) => (
    <button
        type="button"
        role="switch"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${checked ? 'bg-cyan-600' : 'bg-slate-400 dark:bg-slate-600'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        aria-checked={checked}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const WhatsAppIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24">
        <path fill="currentColor" d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91v.01c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.91-7.01zM12.04 20.13c-1.53 0-3.03-.38-4.38-1.12l-.31-.18-3.24.85.87-3.18-.2-.33a8.168 8.168 0 0 1-1.26-4.38c0-4.49 3.62-8.12 8.12-8.12 2.18 0 4.22.86 5.74 2.38s2.38 3.56 2.38 5.74c0 4.49-3.63 8.12-8.12 8.12zm4.2-6.11c-.24-.12-1.42-.7-1.64-.78s-.38-.12-.54.12c-.16.24-.62.78-.76.94s-.28.18-.52.06c-.24-.12-1.02-.38-1.94-1.2c-.72-.64-1.2-1.42-1.35-1.66s-.02-.38.11-.5c.11-.1.24-.26.37-.39s.16-.24.24-.4c.08-.16.04-.3-.02-.42s-.54-1.29-.74-1.76c-.2-.48-.4-.41-.55-.41h-.48c-.16 0-.42.06-.64.3s-.84.82-.84 2c0 1.18.86 2.32 1 2.48s1.69 2.58 4.1 3.59c.58.24 1.03.38 1.4.48s.66.15.91-.09c.28-.27.62-.7.71-1.34s.09-1.2-.01-1.32z" />
    </svg>
);

const EarningStructureContent: React.FC = () => (
    <>
        <p>आपकी कमाई दो तरीकों से होती है: वॉयस कॉल और चैट मैसेज।</p>
        
        <h4>A) वॉयस कॉल के लिए (ब्रैकेट सिस्टम):</h4>
        <p>आपको प्रति मिनट का रेट कॉल की कुल लंबाई (duration) के हिसाब से मिलता है। कॉल जितनी लंबी होगी, प्रति मिनट का रेट उतना ही ज़्यादा होगा।</p>
        <ul>
            <li><strong>5 मिनट तक की कॉल पर:</strong> ₹2.0 प्रति मिनट</li>
            <li><strong>6 से 15 मिनट की कॉल पर:</strong> ₹2.5 प्रति मिनट</li>
            <li><strong>16 से 30 मिनट की कॉल पर:</strong> ₹3.0 प्रति मिनट</li>
            <li><strong>31 से 45 मिनट की कॉल पर:</strong> ₹3.5 प्रति मिनट</li>
            <li><strong>45 मिनट से ज़्यादा की कॉल पर:</strong> ₹3.6 प्रति मिनट</li>
        </ul>
        <p><em>उदाहरण: अगर आप 20 मिनट की कॉल पूरी करते हैं, तो आपकी कमाई होगी: 20 मिनट x ₹3.0/मिनट = ₹60</em></p>

        <h4>B) चैट मैसेज के लिए (फिक्स्ड रेट):</h4>
        <p>आपको हर भेजे गए मैसेज के लिए एक फिक्स्ड रेट मिलता है।</p>
        <ul>
            <li><strong>हर मैसेज पर कमाई:</strong> ₹0.50 प्रति मैसेज</li>
        </ul>
         <p><em>उदाहरण: अगर आप 25 मैसेज का जवाब देते हैं, तो आपकी कमाई होगी: 25 मैसेज x ₹0.50/मैसेज = ₹12.50</em></p>
    </>
);


const ProfileScreen: React.FC = () => {
    const navigate = useNavigate();
    const { profile, loading } = useListener();
    const isInitialLoad = useRef(true);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);

    const [localSettings, setLocalSettings] = useState({
        calls: true,
        messages: true,
    });

    useEffect(() => {
        if (profile?.notificationSettings && isInitialLoad.current) {
            setLocalSettings({
                calls: profile.notificationSettings.calls ?? true,
                messages: profile.notificationSettings.messages ?? true,
            });
            isInitialLoad.current = false;
        }
    }, [profile]);

    const handleAccordionToggle = (accordionKey: string) => {
        setOpenAccordion(prev => (prev === accordionKey ? null : accordionKey));
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };
    
    const handleSettingsChange = async (key: 'calls' | 'messages', value: boolean) => {
        if (!profile?.uid) return;
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        try {
            const listenerRef = db.collection('listeners').doc(profile.uid);
            await listenerRef.update({
                [`notificationSettings.${key}`]: value
            });
            setNotification({ message: 'Settings saved successfully!', type: 'success'});
        } catch (error) {
            console.error(`Failed to update ${key} notification setting:`, error);
            setLocalSettings(prev => ({ ...prev, [key]: !value })); // Revert on error
            setNotification({ message: `Could not save setting for ${key}. Please try again.`, type: 'error'});
        }
    };


  return (
    <div className="p-4 space-y-3">
        {notification && <NotificationBanner message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img 
                    src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.displayName || 'L'}&background=random&color=fff`} 
                    alt="Profile" 
                    className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shrink-0" 
                />
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{profile?.displayName || 'Listener'}</h2>
                </div>
              </div>
              <button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                Logout
              </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <div className="flex justify-between items-center p-4">
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">Incoming Call Ringtones</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Play a sound for new calls.</p>
                    </div>
                    <ToggleSwitch checked={localSettings.calls} onChange={(v) => handleSettingsChange('calls', v)} disabled={loading} />
                </div>
                 <div className="flex justify-between items-center p-4">
                    <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">New Message Sounds</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Play a sound for new messages.</p>
                    </div>
                    <ToggleSwitch checked={localSettings.messages} onChange={(v) => handleSettingsChange('messages', v)} disabled={loading} />
                </div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <a href="https://chat.whatsapp.com/FDgBcmlnuBUFeuSSdy4Yhy?mode=ems_copy_c" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"><WhatsAppIcon className="w-6 h-6" /></div>
                    <div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Join WhatsApp Support Group</span>
                        <p className="text-sm text-slate-500 dark:text-slate-400">For help, questions, and updates.</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </a>
        </div>

        <Accordion 
            title="कमाई कैसे होगी? (How You Earn)"
            isOpen={openAccordion === 'earning'}
            onToggle={() => handleAccordionToggle('earning')}
        >
            <EarningStructureContent />
        </Accordion>
        
        <Accordion 
            title="Listener Guidelines & FAQ"
            isOpen={openAccordion === 'guidelines'}
            onToggle={() => handleAccordionToggle('guidelines')}
        >
            <GuidelinesContent />
        </Accordion>
        
        <Accordion 
            title="Terms & Conditions"
            isOpen={openAccordion === 'terms'}
            onToggle={() => handleAccordionToggle('terms')}
        >
            <TermsContent />
        </Accordion>

        <Accordion 
            title="Privacy Policy"
            isOpen={openAccordion === 'privacy'}
            onToggle={() => handleAccordionToggle('privacy')}
        >
            <PrivacyPolicyContent />
        </Accordion>

    </div>
  );
};

export default ProfileScreen;