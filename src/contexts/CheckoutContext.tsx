import { createContext, useContext, useState, ReactNode } from 'react';

type CheckoutStep = 'select' | 'payment' | 'confirm';

interface CheckoutState {
  isInitializing: boolean;
  isProcessing: boolean;
  currentStep: CheckoutStep;
  selectedTier?: string;
  selectedBilling?: 'monthly' | 'yearly';
  error?: string;
}

interface CheckoutContextType extends CheckoutState {
  setInitializing: (value: boolean) => void;
  setProcessing: (value: boolean) => void;
  setStep: (step: CheckoutStep) => void;
  selectPlan: (tier: string, billing: 'monthly' | 'yearly') => void;
  setError: (error?: string) => void;
  reset: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

const initialState: CheckoutState = {
  isInitializing: false,
  isProcessing: false,
  currentStep: 'select',
  selectedTier: undefined,
  selectedBilling: undefined,
  error: undefined
};

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckoutState>(initialState);

  const setInitializing = (value: boolean) => {
    setState(prev => ({ ...prev, isInitializing: value }));
  };

  const setProcessing = (value: boolean) => {
    setState(prev => ({ ...prev, isProcessing: value }));
  };

  const setStep = (step: CheckoutStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const selectPlan = (tier: string, billing: 'monthly' | 'yearly') => {
    setState(prev => ({
      ...prev,
      selectedTier: tier,
      selectedBilling: billing,
      currentStep: 'payment'
    }));
  };

  const setError = (error?: string) => {
    setState(prev => ({ ...prev, error }));
  };

  const reset = () => {
    setState(initialState);
  };

  return (
    <CheckoutContext.Provider
      value={{
        ...state,
        setInitializing,
        setProcessing,
        setStep,
        selectPlan,
        setError,
        reset
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
}
