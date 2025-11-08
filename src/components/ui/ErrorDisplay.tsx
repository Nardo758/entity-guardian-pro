import { AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: Error | string;
  onRetry?: () => void;
  showSupport?: boolean;
  className?: string;
}

const errorMessages: Record<string, { title: string; message: string; action?: string }> = {
  'stripe_load_failed': {
    title: 'Payment System Unavailable',
    message: 'Unable to connect to the payment processor. Please check your internet connection and try again.',
    action: 'Check Connection'
  },
  'session_expired': {
    title: 'Session Expired',
    message: 'Your session has expired. Please select a plan again to continue.',
    action: 'Select Plan'
  },
  'payment_failed': {
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please check your card details or try a different payment method.',
    action: 'Try Again'
  },
  'network_error': {
    title: 'Connection Error',
    message: 'Unable to connect to our servers. Please check your internet connection and try again.',
    action: 'Retry'
  },
  'invalid_subscription': {
    title: 'Invalid Subscription',
    message: 'The selected subscription plan is not available. Please try selecting a different plan.',
    action: 'View Plans'
  }
};

function getErrorInfo(error: Error | string) {
  const errorString = typeof error === 'string' ? error : error.message;
  
  // Check for known error patterns
  if (errorString.includes('Stripe failed to load')) {
    return errorMessages.stripe_load_failed;
  }
  if (errorString.includes('session') && errorString.includes('expired')) {
    return errorMessages.session_expired;
  }
  if (errorString.includes('payment') && errorString.includes('failed')) {
    return errorMessages.payment_failed;
  }
  if (errorString.includes('network') || errorString.includes('connection')) {
    return errorMessages.network_error;
  }
  
  // Default error
  return {
    title: 'Something Went Wrong',
    message: errorString || 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'Try Again'
  };
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  showSupport = true,
  className 
}: ErrorDisplayProps) {
  const errorInfo = getErrorInfo(error);

  return (
    <Alert variant="destructive" className={cn("my-4", className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p>{errorInfo.message}</p>
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              {errorInfo.action || 'Try Again'}
            </Button>
          )}
          {showSupport && (
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => window.location.href = 'mailto:support@example.com'}
            >
              <Mail className="h-3 w-3" />
              Contact Support
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
