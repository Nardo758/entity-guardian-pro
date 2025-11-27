import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface QuickAccessAuthProps {
  onSuccess?: () => void;
}

const QuickAccessAuth: React.FC<QuickAccessAuthProps> = ({ onSuccess }) => {
  const { signInWithOAuth } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Listen for OAuth errors with enhanced error messages
  useEffect(() => {
    const handleOAuthError = (event: CustomEvent) => {
      const { error, errorDescription, errorCode } = event.detail;
      
      console.log('OAuth error received:', { error, errorDescription, errorCode });
      
      toast({
        title: "Authentication Failed",
        description: errorDescription || "Unable to complete authentication. Please try again.",
        variant: "destructive"
      });
      
      setIsLoading(null);
    };

    window.addEventListener('oauth-error', handleOAuthError as EventListener);
    return () => {
      window.removeEventListener('oauth-error', handleOAuthError as EventListener);
    };
  }, [toast]);

  const handleOAuthSignIn = async (provider: 'google' | 'microsoft') => {
    setIsLoading(provider);
    
    try {
      console.log(`Initiating OAuth sign-in with ${provider}...`);
      const { error } = await signInWithOAuth(provider);
      
      if (error) {
        console.error('OAuth initiation error:', error);
        
        // Provide helpful error messages based on error type
        let message = error.message || 'Failed to initiate authentication.';
        
        if (error.message?.includes('not enabled')) {
          message = `${provider === 'google' ? 'Google' : 'Microsoft'} OAuth is not enabled in Supabase. Please configure it in the Supabase Dashboard.`;
        } else if (error.message?.includes('Invalid OAuth provider')) {
          message = 'OAuth provider configuration is invalid. Please check your Supabase settings.';
        }
        
        toast({
          title: "Authentication Error",
          description: message,
          variant: "destructive"
        });
        setIsLoading(null);
      } else {
        console.log('OAuth redirect initiated successfully');
        if (onSuccess) onSuccess();
        // Note: User will be redirected to OAuth provider, loading state stays active
      }
    } catch (error: any) {
      console.error('Unexpected OAuth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
        {/* Google Button */}
        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading === 'google'}
          className="flex items-center justify-center gap-3 h-12 w-full border-2 hover:bg-secondary/50 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium">
            {isLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
          </span>
        </Button>

        {/* Microsoft Button */}
        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn('microsoft')}
          disabled={isLoading === 'microsoft'}
          className="flex items-center justify-center gap-3 h-12 w-full border-2 hover:bg-secondary/50 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path fill="#F35325" d="M1 1h10v10H1V1z"/>
            <path fill="#81BC06" d="M13 1h10v10H13V1z"/>
            <path fill="#05A6F0" d="M1 13h10v10H1V13z"/>
            <path fill="#FFBA08" d="M13 13h10v10H13V13z"/>
          </svg>
          <span className="text-sm font-medium">
            {isLoading === 'microsoft' ? 'Connecting...' : 'Continue with Microsoft'}
          </span>
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Note: OAuth providers must be configured in Supabase Dashboard
      </p>
    </div>
  );
};

export default QuickAccessAuth;                                                                                                                                                                                                                  