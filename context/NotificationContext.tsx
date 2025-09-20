import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  message: string;
  type: NotificationType;
  isVisible: boolean;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const NotificationUI: React.FC<{
  message: string;
  type: NotificationType;
  onDismiss: () => void;
}> = ({ message, type, onDismiss }) => {
  const baseClasses = "fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm p-4 rounded-xl shadow-2xl flex items-start gap-3 transition-all duration-300 animate-fade-in";
  
  const colorClasses = {
    success: 'bg-green-50 dark:bg-green-900/80 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/80 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/80 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  };

  const Icon: React.FC = () => {
    switch (type) {
        case 'success':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'error':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        default:
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
  };

  return (
    <div className={`${baseClasses} ${colorClasses[type]}`} role="alert">
      <div className="flex-shrink-0 pt-0.5">
        <Icon />
      </div>
      <div className="flex-grow">
        <h3 className="font-bold">SakoonApp</h3>
        <p className="text-sm">{message}</p>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="p-1 -mr-1 -mt-1 rounded-full hover:bg-black/10 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
};


export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    isVisible: false,
  });
  const timerRef = useRef<number | null>(null);

  const dismissNotification = useCallback(() => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
    setNotification((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    // Dismiss any existing notification before showing a new one
    dismissNotification();

    setNotification({ message, type, isVisible: true });
    
    timerRef.current = window.setTimeout(() => {
      dismissNotification();
    }, 5000);
  }, [dismissNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification.isVisible && (
        <NotificationUI
          message={notification.message}
          type={notification.type}
          onDismiss={dismissNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
