import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VerifyEmail = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(true);
  const [verifyMessage, setVerifyMessage] = useState<string>('Verifying your email...');

  // Auto-verify when arriving from email link: /verify-email?type=signup&token_hash=...&email=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type') as 'signup' | 'recovery' | 'invite' | 'magic_link' | 'email_change' | null;
    const tokenHash = params.get('token_hash');
    const email = params.get('email');

    if (!typeParam || !tokenHash) {
      setVerifying(false);
      return;
    }

    (async () => {
      try {
        setVerifying(true);
        setError(null);
        const { data, error } = await supabase.auth.verifyOtp({
          type: typeParam,
          token_hash: tokenHash,
        } as any);
        if (error) {
          setError(error.message || 'Verification failed');
          setVerifyMessage('Verification failed');
          setVerifying(false);
          return;
        }
        setVerifyMessage('Email verified! Redirecting...');
        // Redirect to dashboard; guards will route appropriately
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } catch (e: any) {
        setError(e?.message || 'Verification failed');
        setVerifyMessage('Verification failed');
        setVerifying(false);
      }
    })();
  }, [location.search, navigate]);

  const resendVerification = async () => {
    if (!user?.email) return;
    setIsSending(true);
    try {
      setError(null);
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: { emailRedirectTo: redirectUrl },
      } as any);
      if (!error) {
        setSent(true);
      } else {
        setError(error.message || 'Failed to send verification email');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg">
          <Mail className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        {verifying ? (
          <p className="text-muted-foreground">{verifyMessage}</p>
        ) : (
          <p className="text-muted-foreground">
            We sent a confirmation link to {user?.email}. Click the link in your email to finish setting up your account.
          </p>
        )}
        <div className="space-y-2">
          <Button onClick={resendVerification} disabled={isSending || verifying} className="w-full">
            {isSending ? 'Sending...' : 'Resend verification email'}
          </Button>
          {sent && <p className="text-sm text-green-600">Verification email sent. Please check your inbox.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;


