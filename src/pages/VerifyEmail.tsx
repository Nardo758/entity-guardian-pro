import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [verifying, setVerifying] = useState<boolean>(true);
  const [verifySuccess, setVerifySuccess] = useState<boolean>(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);

  // Auto-verify when arriving from email link: /verify-email?type=signup&token_hash=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type') as 'signup' | 'recovery' | 'invite' | 'magic_link' | 'email_change' | null;
    const tokenHash = params.get('token_hash');

    if (!typeParam || !tokenHash) {
      setVerifying(false);
      return;
    }

    (async () => {
      try {
        setVerifying(true);
        const { error } = await supabase.auth.verifyOtp({
          type: typeParam,
          token_hash: tokenHash,
        } as any);
        
        if (error) {
          toast({
            title: "Verification failed",
            description: error.message || "The verification link is invalid or has expired.",
            variant: "destructive"
          });
          setVerifying(false);
          return;
        }
        
        setVerifySuccess(true);
        toast({
          title: "Email verified! 🎉",
          description: "Your email has been successfully verified. Redirecting to dashboard...",
        });
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch (e: any) {
        toast({
          title: "Verification error",
          description: e?.message || "An unexpected error occurred during verification.",
          variant: "destructive"
        });
        setVerifying(false);
      }
    })();
  }, [location.search, navigate, toast]);

  const resendVerification = async () => {
    if (!user?.email) return;

    // Rate limiting: Only allow resending once per minute
    if (lastSentTime && Date.now() - lastSentTime < 60000) {
      const secondsRemaining = Math.ceil((60000 - (Date.now() - lastSentTime)) / 1000);
      toast({
        title: "Please wait",
        description: `You can resend the email in ${secondsRemaining} seconds.`,
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: { emailRedirectTo: redirectUrl },
      } as any);
      
      if (!error) {
        setLastSentTime(Date.now());
        toast({
          title: "Verification email sent! 📧",
          description: "Please check your inbox and spam folder.",
        });
      } else {
        toast({
          title: "Failed to send email",
          description: error.message || "Could not send verification email. Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  // If user is already verified, redirect to dashboard
  useEffect(() => {
    if (user?.email_confirmed_at && !verifying) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.email_confirmed_at, verifying, navigate]);

  if (verifySuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your email has been successfully verified. Redirecting you to the dashboard...
            </p>
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              We sent a confirmation link to:
            </p>
            <p className="font-medium text-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">
              Click the link in your email to verify your account and access all features.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={resendVerification} 
              disabled={isSending} 
              className="w-full"
              variant="default"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or contact support if the issue persists.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;


