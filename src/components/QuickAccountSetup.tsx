import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Lock, Eye, EyeOff, RotateCcw } from 'lucide-react';
import PasswordResetForm from './PasswordResetForm';
import QuickAccessAuth from './QuickAccessAuth';
import { supabase } from '@/integrations/supabase/client';

const QuickAccountSetup: React.FC = () => {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: 'https://entityrenewalpro.com'
        }
      });

      if (error) {
        toast({
          title: "Failed to resend email",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Email Sent! 📧",
          description: "Verification email has been sent. Please check your inbox.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Passwords don't match. Please check and try again.",
            variant: "destructive"
          });
          return;
        }

        // const { error, data } = await signUp(formData.email, formData.password, {
        //   first_name: 'Admin',
        //   last_name: 'User',
        //   company: 'My Company'
        // });

        const { error, data } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: 'Admin',
              last_name: 'User',
              company: 'My Company'
            }
          }
        });

        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          console.log('Signup data:', data);
          if (data.user && !data.user.email_confirmed_at) {
            toast({
              title: "Account Created! 🎉",
              description: "Check your email to confirm your account, then you can sign in.",
            });
          } else {
            toast({
              title: "Account Created! 🎉",
              description: "Your account has been created successfully. You can now sign in.",
            });
          }
          setMode('signin');
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message + " - Try creating an account if you don't have one.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome! 🎉",
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

  if (mode === 'reset') {
    return <PasswordResetForm onBack={() => setMode('signin')} />;
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
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
              className="w-full"
            >
              {isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="text-center pt-4 space-y-2">
            <Button
              variant="ghost"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm"
            >
              {mode === 'signin' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </Button>

            {mode === 'signin' && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setMode('reset')}
                  className="text-sm text-orange-600 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Forgot Password
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-white"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Resend Verification Email
                </Button>
              </div>
            )}
          </div>

          {/* Quick Access Authentication */}
          <QuickAccessAuth />

        </CardContent>
      </Card>
    </div>
  );
};

export default QuickAccountSetup;