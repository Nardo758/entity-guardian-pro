import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onMaxRetriesReached?: () => void;
  autoRetry?: boolean;
}

interface ErrorRecoveryState {
  error: Error | null;
  isRecovering: boolean;
  retryCount: number;
  canRetry: boolean;
}

export function useErrorRecovery(options: ErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    onMaxRetriesReached,
    autoRetry = false,
  } = options;

  const navigate = useNavigate();
  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRecovering: false,
    retryCount: 0,
    canRetry: true,
  });

  useEffect(() => {
    if (state.error && autoRetry && state.canRetry) {
      const timer = setTimeout(() => {
        handleRetry();
      }, retryDelay * Math.pow(2, state.retryCount)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [state.error, autoRetry, state.canRetry]);

  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    setState((prev) => {
      const newRetryCount = prev.retryCount + 1;
      const canRetry = newRetryCount < maxRetries;

      if (!canRetry && onMaxRetriesReached) {
        onMaxRetriesReached();
      }

      return {
        error,
        isRecovering: false,
        retryCount: newRetryCount,
        canRetry,
      };
    });

    // Show user-friendly error toast
    const errorMessage = getErrorMessage(error);
    toast.error(errorMessage.title, {
      description: errorMessage.description,
    });
  }, [maxRetries, onMaxRetriesReached]);

  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRecovering: true,
      error: null,
    }));

    // Reset after a short delay to allow component to re-render
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isRecovering: false,
      }));
    }, 100);
  }, []);

  const resetError = useCallback(() => {
    setState({
      error: null,
      isRecovering: false,
      retryCount: 0,
      canRetry: true,
    });
  }, []);

  const handleAuthError = useCallback(() => {
    // Clear auth state and redirect to login
    localStorage.removeItem('supabase.auth.token');
    toast.error('Session expired', {
      description: 'Please sign in again to continue',
    });
    navigate('/login');
  }, [navigate]);

  const handleNetworkError = useCallback(() => {
    toast.error('Connection lost', {
      description: 'Please check your internet connection and try again',
      action: {
        label: 'Retry',
        onClick: handleRetry,
      },
    });
  }, [handleRetry]);

  const handlePermissionError = useCallback(() => {
    toast.error('Access denied', {
      description: 'You do not have permission to perform this action',
    });
    navigate('/');
  }, [navigate]);

  return {
    ...state,
    handleError,
    handleRetry,
    resetError,
    handleAuthError,
    handleNetworkError,
    handlePermissionError,
  };
}

function getErrorMessage(error: Error): { title: string; description: string } {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return {
      title: 'Connection Error',
      description: 'Unable to connect. Please check your internet connection.',
    };
  }

  if (message.includes('session') || message.includes('token') || message.includes('expired')) {
    return {
      title: 'Session Expired',
      description: 'Your session has expired. Please sign in again.',
    };
  }

  if (message.includes('unauthorized') || message.includes('permission') || message.includes('forbidden')) {
    return {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource.',
    };
  }

  if (message.includes('auth') || message.includes('login') || message.includes('signin')) {
    return {
      title: 'Authentication Error',
      description: 'There was a problem with authentication. Please try again.',
    };
  }

  if (message.includes('timeout')) {
    return {
      title: 'Request Timeout',
      description: 'The request took too long. Please try again.',
    };
  }

  return {
    title: 'Something Went Wrong',
    description: error.message || 'An unexpected error occurred. Please try again.',
  };
}
