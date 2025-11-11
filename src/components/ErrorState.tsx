import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
  fullScreen?: boolean;
  title?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry,
  fullScreen = false,
  title = 'Something went wrong'
}) => {
  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-background px-4'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="max-w-md w-full bg-card shadow-md rounded-lg p-6 text-center border border-border">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-destructive/10 rounded-full mb-4">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="default"
            className="flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export const InlineErrorState: React.FC<{ error: Error | null; onRetry?: () => void }> = ({ 
  error, 
  onRetry 
}) => {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-destructive font-medium mb-1">Error</p>
          <p className="text-sm text-destructive/90">
            {error?.message || 'An unexpected error occurred.'}
          </p>
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
