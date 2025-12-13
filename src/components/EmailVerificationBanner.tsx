import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const EmailVerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);

  // Don't show banner if user is not logged in, email is verified, or banner is dismissed
  if (!user || user.email_confirmed_at || isDismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    // Prevent spam: Only allow resending once per minute
    if (lastSentTime && Date.now() - lastSentTime < 60000) {
      const secondsRemaining = Math.ceil((60000 - (Date.now() - lastSentTime)) / 1000);
      toast({
        title: "Please wait",
        description: `You can resend the email in ${secondsRemaining} seconds.`,
        variant: "destructive"
      });
      return;
    }

    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Failed to resend email",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setLastSentTime(Date.now());
        toast({
          title: "Verification email sent! 📧",
          description: "Please check your inbox and spam folder.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="w-full border-b-2 border-orange-300 bg-orange-100 dark:bg-orange-950/40 dark:border-orange-800">
      <div className="w-full max-w-4xl mx-auto px-4 py-4">
        <Alert className="border-0 bg-transparent p-0">
          <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:items-start sm:text-left">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-200 dark:bg-orange-900/50 flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-orange-900 dark:text-orange-100">
                    Email verification required
                  </p>
                  <AlertDescription className="text-sm text-orange-800 dark:text-orange-200">
                    Please verify your email address ({user.email}) to access all features.
                    Check your inbox and click the verification link.
                  </AlertDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-900 hover:bg-orange-200 dark:text-orange-400 dark:hover:text-orange-100 dark:hover:bg-orange-900/50 flex-shrink-0 rounded-full"
                  aria-label="Dismiss"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  size="default"
                  variant="outline"
                  className="bg-white dark:bg-gray-900 border-orange-400 dark:border-orange-600 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950 font-medium"
                >
                  {isResending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend verification email
                    </>
                  )}
                </Button>
                {lastSentTime && (
                  <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    <span>Email sent! Check your inbox</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Alert>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
