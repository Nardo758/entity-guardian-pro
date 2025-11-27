import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Check, X, AlertTriangle } from 'lucide-react';

const ADMIN_AUTH_URL = 'https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/admin-auth';

const AdminSetup: React.FC = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);

  // Check if setup is required
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await fetch(`${ADMIN_AUTH_URL}?action=check-setup`);
        const data = await response.json();
        setSetupRequired(data.setupRequired);
        
        if (!data.setupRequired) {
          navigate('/admin/login', { replace: true });
        }
      } catch (err) {
        console.error('Failed to check setup status:', err);
      }
    };
    checkSetup();
  }, [navigate]);

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

  if (setupRequired === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Admin Account Created</h2>
            <p className="text-slate-400 text-center">
              Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Alert className="bg-blue-950/50 border-blue-800 text-blue-200">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No admin accounts exist. Create the first administrator account to get started.
          </AlertDescription>
        </Alert>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Admin Setup</CardTitle>
              <CardDescription className="text-slate-400">
                Create the first administrator account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-slate-300">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Administrator"
                  required
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-slate-300 mb-2">Password Requirements:</p>
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
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-slate-500" />
                    )}
                    <span className={check ? 'text-green-400' : 'text-slate-500'}>{label}</span>
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
