import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';

const ADMIN_AUTH_URL = 'https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/admin-auth';
const CHECK_TIMEOUT_MS = 10000; // 10 second timeout

type CheckStatus = 'loading' | 'error' | 'ready' | 'redirecting';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      
      if (data.setupRequired) {
        setCheckStatus('redirecting');
        navigate('/admin/setup', { replace: true });
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

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && checkStatus === 'ready') {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location, checkStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (checkStatus === 'loading' || checkStatus === 'redirecting' || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">
              {checkStatus === 'redirecting' 
                ? 'Redirecting to setup...' 
                : authLoading 
                  ? 'Verifying session...'
                  : 'Connecting to admin service...'}
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Warning Banner */}
        <Alert className="bg-warning-muted border-warning/30 text-warning-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-foreground">
            This is a restricted administrative area. Unauthorized access attempts are logged and monitored.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Admin Portal</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to access the administration panel
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-destructive-muted border-destructive/30">
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Sessions expire after 4 hours. MFA may be required for certain actions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to main site link */}
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Return to main site
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
