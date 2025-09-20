import React, { useState, useEffect, useCallback } from 'react';

// The BeforeInstallPromptEvent is not a standard event type, so we define it here for clarity.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWAButton: React.FC = () => {
  // State to hold the event that triggers the install prompt.
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // FIX: Corrected a typo in the type assertion. It should be BeforeInstallPromptEvent.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Check if the app is already running in standalone mode (installed).
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  if (!deferredPrompt || isStandalone) {
    return null;
  }

  // Render a prominent installation card instead of a floating banner.
  return (
    <div className="bg-gradient-to-r from-cyan-500 to-teal-400 dark:from-cyan-800 dark:to-teal-700 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
            <img src="https://listenerimages.netlify.app/images/icon3.png" alt="App Icon" className="w-12 h-12 flex-shrink-0"/>
            <div>
                <h3 className="font-bold text-white text-lg">Install SakoonApp</h3>
                <p className="text-sm text-cyan-100 dark:text-cyan-200">Get the best experience. Add to your home screen.</p>
            </div>
        </div>
        <button
            onClick={handleInstallClick}
            className="flex-shrink-0 bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900 text-cyan-600 dark:text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-md text-sm"
        >
            Install
        </button>
    </div>
  );
};

export default InstallPWAButton;
