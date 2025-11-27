import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

const ADMIN_AUTH_URL = 'https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/admin-auth';
const CHECK_TIMEOUT_MS = 10000; // 10 second timeout

type CheckStatus = 'loading' | 'error' | 'ready' | 'redirecting';

const AdminSetup: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>('loading');
  const [checkError, setCheckError] = useState<string | null>(null);

  // Check if setup is required with timeout
  const checkSetup = useCallback(async () => {
    setCheckStatus('loading');
    setCheckError(null);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    try {
      const response = await fetch(`${ADMIN_AUTH_URL}?action=check-setup`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.setupRequired) {
        setCheckStatus('redirecting');
        navigate('/admin/login', { replace: true });
      } else {
        setCheckStatus('ready');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Failed to check setup status:', err);
      
      if (err instanceof Error && err.name === 'AbortError') {
        setCheckError('Connection timed out. The server may be unavailable.');
      } else {
        setCheckError('Failed to connect to the admin service. Please try again.');
      }
      setCheckStatus('error');
    }
  }, [navigate]);

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  const passwordChecks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    match: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please ensure all password requirements are met');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${ADMIN_AUTH_URL}?action=setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Setup failed');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (checkStatus === 'loading' || checkStatus === 'redirecting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">
              {checkStatus === 'redirecting' ? 'Redirecting to login...' : 'Checking admin setup status...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (checkStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Connection Error</h2>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              {checkError}
            </p>
            <Button
              onClick={checkSetup}
              className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <a
              href="/"
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Return to main site
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Admin Account Created</h2>
            <p className="text-muted-foreground text-center">
              Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Alert className="bg-info-muted border-info/30">
          <Shield className="h-4 w-4 text-info" />
          <AlertDescription className="text-foreground">
            No admin accounts exist. Create the first administrator account to get started.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Admin Setup</CardTitle>
              <CardDescription className="text-muted-foreground">
                Create the first administrator account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive-muted border-destructive/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Administrator"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-foreground mb-2">Password Requirements:</p>
                {[
                  { check: passwordChecks.length, label: 'At least 12 characters' },
                  { check: passwordChecks.uppercase, label: 'One uppercase letter' },
                  { check: passwordChecks.lowercase, label: 'One lowercase letter' },
                  { check: passwordChecks.number, label: 'One number' },
                  { check: passwordChecks.special, label: 'One special character' },
                  { check: passwordChecks.match, label: 'Passwords match' },
                ].map(({ check, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    {check ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={check ? 'text-success' : 'text-muted-foreground'}>{label}</span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  'Create Admin Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSetup;
