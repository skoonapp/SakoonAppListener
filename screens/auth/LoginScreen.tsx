// FIX: Corrected the import statement for React hooks.
import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../../utils/firebase';
import ApplyAsListener from '../../components/auth/ApplyAsListener';

// --- Icon Components ---
const LockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

const SecurityBadge: React.FC = () => (
    <div className="flex justify-center items-center space-x-8 my-6 text-slate-300 animate-fade-in">
        <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-400">
                <path fillRule="evenodd" d="M9.661 2.231a.75.75 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.802.75.75 0 0 1 .466.71-12.034 12.034 0 0 1-7.58 10.923.75.75 0 0 1-.662 0A12.034 12.034 0 0 1 2.117 5.743a.75.75 0 0 1 .466-.71 11.947 11.947 0 0 0 7.078-2.802ZM12.23 8.23a.75.75 0 0 0-1.06-1.06L9.5 8.94 8.23 7.67a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l2.25-2.25Z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Secure Login</span>
        </div>
        <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-400">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Privacy Protected</span>
        </div>
    </div>
);


declare global {
  interface Window {
    recaptchaVerifier?: firebase.auth.RecaptchaVerifier;
    confirmationResult?: firebase.auth.ConfirmationResult;
  }
}

const LoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: number;
    if (step === 'otp' && resendTimer > 0 && !canResend) {
      interval = window.setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer <= 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer, canResend]);

  useEffect(() => {
    if (step === 'phone') {
      setResendTimer(30);
      setCanResend(false);
      setError('');
    }
  }, [step]);
  
  // Dynamic loading messages for better UX during OTP delay
  useEffect(() => {
    // FIX: Corrected timer type from NodeJS.Timeout to number for browser environment.
    let messageTimer: number;
    if (loading && (loadingMessage.startsWith('OTP भेजा'))) {
        const messages = [
            "सुरक्षित कनेक्शन शुरू हो रहा है...",
            "सुरक्षा जांच की जा रही है...",
            `+91 ${phoneNumber} के लिए OTP का अनुरोध किया जा रहा है...`,
            "SMS भेजा जा रहा है...",
            "बस लगभग हो गया..."
        ];
        let messageIndex = 0;
        const showNextMessage = () => {
            setLoadingMessage(messages[messageIndex]);
            messageIndex = (messageIndex + 1) % messages.length;
        };
        showNextMessage();
        messageTimer = window.setInterval(showNextMessage, 3000);
    }
    // FIX: Use clearInterval for timers created with setInterval.
    return () => clearInterval(messageTimer);
  }, [loading, loadingMessage, phoneNumber]);


  const sendOtp = async () => {
    setError('');
    if (phoneNumber.length !== 10) {
      setError('कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।');
      setLoading(false);
      return;
    }

    try {
      // Re-create the verifier each time to ensure it's fresh and avoid state issues.
      const verifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': () => {} // Callback for auto-submission, not needed here.
      });
      window.recaptchaVerifier = verifier;

      const confirmationResult = await auth.signInWithPhoneNumber(`+91${phoneNumber}`, verifier);
      window.confirmationResult = confirmationResult;
      setStep('otp');
      setResendTimer(30);
      setCanResend(false);
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      let errorMessage = 'OTP भेजने में विफल। कृपया अपना नंबर जांचें और पुनः प्रयास करें।';
      if (err.code === 'auth/too-many-requests') {
        errorMessage = 'इस नंबर से बहुत ज़्यादा अनुरोध किए गए हैं। कृपया कुछ समय बाद पुनः प्रयास करें।';
      } else if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'यह एक अमान्य फ़ोन नंबर है। कृपया पुनः जांच करें।';
      } else if (err.message.includes('reCAPTCHA')) {
        errorMessage = 'reCAPTCHA सत्यापन में समस्या। कृपया पृष्ठ को रीफ़्रेश करें।';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage('OTP भेजा जा रहा है...');
    await sendOtp();
  };
  
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage('OTP सत्यापित किया जा रहा है...');
    setError('');

    if (!window.confirmationResult) {
      setError('आपका OTP सत्र समाप्त हो गया है। कृपया वापस जाकर एक नया OTP अनुरोध करें।');
      setLoading(false);
      setLoadingMessage('');
      return;
    }

    if (otp.length !== 6) {
      setError('कृपया 6-अंकीय OTP दर्ज करें।');
      setLoading(false);
      return;
    }

    try {
      await window.confirmationResult.confirm(otp);
      setLoadingMessage('सफलतापूर्वक! लॉग इन किया जा रहा है...');
      // On success, App.tsx router will handle navigation.
      // We don't setLoading(false) to prevent flicker.
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      let errorMessage = 'अमान्य OTP। कृपया कोड जांचें और पुनः प्रयास करें।';
      if (err.code === 'auth/session-expired') {
          errorMessage = 'सत्यापन कोड समाप्त हो गया है। कृपया एक नया अनुरोध करें।';
      }
      setError(errorMessage);
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    
    setLoading(true);
    setLoadingMessage('OTP फिर से भेजा जा रहा है...');
    await sendOtp();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start pt-20 p-4 relative overflow-hidden">
      <div id="recaptcha-container"></div>

      <div className="absolute inset-0 z-0">
          <div 
              className="absolute inset-0 bg-cover bg-center opacity-30" 
              style={{backgroundImage: `url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop')`}}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white">SakoonApp Admin</h1>
            <p className="mt-3 text-lg text-cyan-200">Listener Portal Login</p>
        </div>
        {step === 'phone' ? (
           <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
               <form onSubmit={handlePhoneSubmit}>
                   <div className="relative mb-4">
                       <input 
                         type="tel" 
                         value={phoneNumber} 
                         onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} 
                         placeholder="📞 +91  मोबाइल नंबर"
                         className="w-full bg-white/10 border border-white/20 text-white placeholder-cyan-200/50 text-lg rounded-xl block p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-colors" 
                         required 
                         maxLength={10}
                       />
                   </div>
                   <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed flex items-center justify-center">
                       {loading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                       {loading ? loadingMessage : 'OTP पाएं'}
                   </button>
               </form>

               <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-white/20"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
                  <div className="flex-grow border-t border-white/20"></div>
                </div>

                <ApplyAsListener />

               {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-4 text-sm">{error}</p>}
               
               <p className="text-xs text-slate-400 text-center mt-4 px-4">
                  This site is protected by reCAPTCHA and the Google
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-200"> Privacy Policy </a> 
                  and 
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-200"> Terms of Service </a> 
                  apply.
                </p>

               <SecurityBadge />
               <p className="text-xs text-slate-400 text-center mt-6">App Version: 1.0.1 (Stable)</p>
           </div>
        ) : (
          <>
            <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-white/20 p-8 rounded-2xl">
              <div className="text-center mb-6">
                <p className="text-slate-300">इस नंबर पर भेजा गया कोड दर्ज करें:</p>
                <p className="font-bold text-white text-lg mt-1">+91 {phoneNumber}</p>
              </div>
              <form onSubmit={handleOtpSubmit} className="mb-4">
                  <div className="relative mb-4">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <LockIcon className="w-5 h-5"/>
                      </div>
                      <input
                          type="tel"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          placeholder="6-अंकीय OTP"
                          className="w-full bg-white/10 border border-white/20 text-white placeholder-cyan-200/50 text-lg rounded-xl tracking-[0.5em] text-center p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-colors"
                          required
                          maxLength={6}
                      />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800 disabled:cursor-not-allowed flex items-center justify-center">
                       {loading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                       {loading ? loadingMessage : 'सत्यापित करें और लॉग इन करें'}
                  </button>
              </form>
              {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-4 text-sm">{error}</p>}
              <SecurityBadge />
              <hr className="border-t border-white/10" />
              <div className="text-center pt-6">
                 {canResend ? (
                     <button onClick={handleResendOtp} disabled={loading} className="text-sm text-cyan-200 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">OTP फिर से भेजें</button>
                 ) : (
                    <p className="text-sm text-slate-400">{resendTimer}s में OTP फिर से भेजें</p>
                 )}
              </div>
              <button onClick={() => setStep('phone')} className="w-full text-center mt-6 text-sm text-slate-400 hover:text-cyan-200">
                नंबर बदलें
              </button>
            </div>
          </>
        )}
      </div>
      
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-slate-400 z-10">
        <p>SakoonApp by Metxfitt Pvt. Ltd. | © 2025 All Rights Reserved</p>
        <p className="mt-1">Contact: support@sakoonapp.com | Follow us: @SakoonApp</p>
      </footer>
    </div>
  );
};

export default LoginScreen;