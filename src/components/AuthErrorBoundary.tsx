import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, LogIn, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
}

interface AuthError {
  type: 'auth' | 'network' | 'session' | 'permission' | 'unknown';
  title: string;
  message: string;
  recoverable: boolean;
  actions: {
    label: string;
    action: () => void;
    icon: ReactNode;
    variant?: 'default' | 'outline' | 'secondary';
  }[];
}

class AuthErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
    isRecovering: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Attempt automatic recovery for certain errors
    this.attemptAutoRecovery(error);
  }

  public componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private classifyError(error: Error): AuthError {
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return {
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to connect to the authentication server. Please check your internet connection.',
        recoverable: true,
        actions: [
          {
            label: 'Retry Connection',
            action: () => this.handleRetry(),
            icon: <RefreshCw className="w-4 h-4" />,
            variant: 'default',
          },
          {
            label: 'Go to Home',
            action: () => this.handleGoHome(),
            icon: <Home className="w-4 h-4" />,
            variant: 'outline',
          },
        ],
      };
    }

    // Session errors
    if (errorMessage.includes('session') || errorMessage.includes('token') || errorMessage.includes('expired')) {
      return {
        type: 'session',
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again to continue.',
        recoverable: true,
        actions: [
          {
            label: 'Sign In Again',
            action: () => this.handleSignInRedirect(),
            icon: <LogIn className="w-4 h-4" />,
            variant: 'default',
          },
          {
            label: 'Go to Home',
            action: () => this.handleGoHome(),
            icon: <Home className="w-4 h-4" />,
            variant: 'outline',
          },
        ],
      };
    }

    // Permission/auth errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      return {
        type: 'permission',
        title: 'Access Denied',
        message: 'You do not have permission to access this resource. Please sign in with the correct account.',
        recoverable: true,
        actions: [
          {
            label: 'Sign In',
            action: () => this.handleSignInRedirect(),
            icon: <LogIn className="w-4 h-4" />,
            variant: 'default',
          },
          {
            label: 'Go to Home',
            action: () => this.handleGoHome(),
            icon: <Home className="w-4 h-4" />,
            variant: 'outline',
          },
        ],
      };
    }

    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('signin')) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        message: 'There was a problem with authentication. Please try signing in again.',
        recoverable: true,
        actions: [
          {
            label: 'Try Again',
            action: () => this.handleRetry(),
            icon: <RefreshCw className="w-4 h-4" />,
            variant: 'default',
          },
          {
            label: 'Sign In',
            action: () => this.handleSignInRedirect(),
            icon: <LogIn className="w-4 h-4" />,
            variant: 'outline',
          },
        ],
      };
    }

    // Unknown errors
    return {
      type: 'unknown',
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Our team has been notified.',
      recoverable: true,
      actions: [
        {
          label: 'Try Again',
          action: () => this.handleRetry(),
          icon: <RefreshCw className="w-4 h-4" />,
          variant: 'default',
        },
        {
          label: 'Go to Home',
          action: () => this.handleGoHome(),
          icon: <Home className="w-4 h-4" />,
          variant: 'outline',
        },
      ],
    };
  }

  private attemptAutoRecovery(error: Error) {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.log('Max retry attempts reached');
      return;
    }

    const classified = this.classifyError(error);

    // Only auto-retry for network errors
    if (classified.type === 'network') {
      this.setState({ isRecovering: true });

      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, retryCount) * 2000;

      this.retryTimeout = setTimeout(() => {
        console.log(`Auto-recovery attempt ${retryCount + 1}/${maxRetries}`);
        this.handleRetry();
      }, delay);
    }
  }

  private handleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
    }));
  };

  private handleSignInRedirect = () => {
    // Clear any stale auth data
    localStorage.removeItem('supabase.auth.token');
    window.location.href = '/login';
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
    });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const classified = this.classifyError(this.state.error);
      const { maxRetries = 3 } = this.props;
      const { retryCount, isRecovering } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full space-y-6">
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">{classified.title}</AlertTitle>
              <AlertDescription className="mt-3 space-y-4">
                <p className="text-sm leading-relaxed">{classified.message}</p>

                {isRecovering && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Attempting automatic recovery... ({retryCount + 1}/{maxRetries})</span>
                  </div>
                )}

                {!isRecovering && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {classified.actions.map((action, index) => (
                      <Button
                        key={index}
                        onClick={action.action}
                        variant={action.variant || 'default'}
                        size="sm"
                        className="gap-2"
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {retryCount > 0 && retryCount < maxRetries && !isRecovering && (
                  <p className="text-xs text-muted-foreground">
                    Retry attempt {retryCount} of {maxRetries}
                  </p>
                )}

                {retryCount >= maxRetries && (
                  <p className="text-xs text-muted-foreground">
                    Maximum retry attempts reached. Please contact support if the problem persists.
                  </p>
                )}

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4 p-3 bg-muted/50 rounded-md border border-border">
                    <summary className="cursor-pointer text-xs font-medium mb-2">
                      Error Details (Development)
                    </summary>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>

            {classified.recoverable && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact{' '}
                  <a href="mailto:support@entityguardianpro.com" className="text-primary hover:underline">
                    support@entityguardianpro.com
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
