import { createContext, useContext } from 'react';

interface PTRContextType {
  /**
   * Registers a refresh handler for the current screen, enabling pull-to-refresh.
   * @param onRefresh An async function to execute when a refresh is triggered.
   */
  enablePTR: (onRefresh: () => Promise<any>) => void;
  /**
   * Disables pull-to-refresh for the current screen.
   */
  disablePTR: () => void;
}

export const PTRContext = createContext<PTRContextType | undefined>(undefined);

/**
 * Custom hook to access the Pull-to-Refresh context.
 * Provides `enablePTR` and `disablePTR` functions.
 */
export const usePTR = (): PTRContextType => {
  const context = useContext(PTRContext);
  if (!context) {
    throw new Error("usePTR must be used within a MainLayout that provides PTRContext");
  }
  return context;
};
