import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Building, CheckCircle, Mail, Lock,
  Eye, EyeOff, ArrowLeft, Home, LogIn
} from 'lucide-react';

const SignOutConfirmation = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const { toast } = useToast();

  const [showSignInOptions, setShowSignInOptions] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Passwords don't match. Please check and try again.",
            variant: "destructive"
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password);

        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Account Created! 🎉",
            description: "Check your email to confirm your account, then you can sign in.",
          });
          setAuthMode('signin');
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back! 🎉",
            description: "Successfully signed in.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOAuthSignIn = async (provider: 'google' | 'microsoft') => {
    try {
      const { error } = await signInWithOAuth(provider);

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Redirecting...",
          description: `Signing in with ${provider === 'google' ? 'Google' : 'Microsoft'}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePhoneAuth = () => {
    toast({
      title: "Phone Authentication",
      description: "Phone authentication will be available soon.",
      variant: "default"
    });
  };

  if (showSignInOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Button
                variant="ghost"
                onClick={() => setShowSignInOptions(false)}
                className="absolute top-4 left-4 p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <LogIn className="h-8 w-8 text-primary-foreground" />
              </div>

              <CardTitle className="text-2xl font-bold">
                {authMode === 'signin' ? 'Sign Back In' : 'Create New Account'}
              </CardTitle>
              <p className="text-muted-foreground">
                {authMode === 'signin'
                  ? 'Welcome back! Please sign in to your account.'
                  : 'Join Entity Renewal Pro to get started.'
                }
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Email/Password Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ?
                        <EyeOff className="h-4 w-4 text-muted-foreground" /> :
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      }
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                >
                  {isLoading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* OAuth Providers */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  className="w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  Continue with Google
                </Button>
              </div>

              <div className="text-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-sm"
                >
                  {authMode === 'signin'
                    ? "Don't have an account? Create one"
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>

              <div className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our{' '}
                <a href="/terms" className="underline hover:text-foreground">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Sign-out Confirmation */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm text-center">
          <CardHeader className="pb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-success to-success/80 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>

            <CardTitle className="text-3xl font-bold mb-4">
              You've Been Successfully Signed Out
            </CardTitle>

            <p className="text-muted-foreground text-lg">
              Your session has been securely terminated. All authentication tokens have been cleared for your security.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 text-lg px-8"
              >
                <Home className="h-5 w-5" />
                Return to Home
              </Button>

              <Button
                onClick={() => setShowSignInOptions(true)}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary flex items-center gap-2 text-lg px-8"
              >
                <LogIn className="h-5 w-5" />
                Sign Back In
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Quick Access</span>
              </div>
            </div>

            {/* Quick OAuth Options */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn('google')}
                className="flex items-center gap-2 p-4 h-auto hover:bg-secondary/50 transition-colors w-full max-w-sm"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Continue with Google</span>
              </Button>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-border/50">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Entity Renewal Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure entity management for modern businesses
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignOutConfirmation;