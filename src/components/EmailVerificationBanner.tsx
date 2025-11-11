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
    <div className="w-full border-b border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50">
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-0 bg-transparent p-0">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
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
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-100 flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  size="sm"
                  variant="outline"
                  className="bg-white dark:bg-gray-900 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  {isResending ? (
                    <>
                      <div className="w-3 h-3 border-2 border-orange-600/30 border-t-orange-600 rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-3 w-3 mr-2" />
                      Resend verification email
                    </>
                  )}
                </Button>
                {lastSentTime && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
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
