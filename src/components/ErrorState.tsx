import { memo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  error: Error | null;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  fullScreen?: boolean;
}

export const ErrorState = memo<ErrorStateProps>(({ 
  error, 
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try again',
  fullScreen = false 
}) => {
  if (!error) return null;

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 p-4'
    : 'py-8 px-4';

  return (
    <div className={containerClasses}>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm">{error.message}</p>
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
});

ErrorState.displayName = 'ErrorState';
