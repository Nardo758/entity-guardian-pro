import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import QuickAccessAuth from './QuickAccessAuth';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quickSignupSchema, type QuickSignupFormData } from '@/lib/validations/auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const QuickAccountSetup: React.FC = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<QuickSignupFormData>({
    resolver: zodResolver(quickSignupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: QuickSignupFormData) => {
    setIsLoading(true);

    try {
      const { error } = await signUp(data.email, data.password, {
        first_name: '',
        last_name: '',
        user_type: 'entity_owner'
      });

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          toast({
            title: "Account already exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else if (error.message?.includes('Email rate limit exceeded')) {
          toast({
            title: "Too many requests",
            description: "Please wait a few minutes before trying again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Account Created! 🎉",
          description: "Check your email to verify your account, then you can sign in.",
        });
        // Clear form
        form.reset();
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

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Quick signup to get started
          </p>
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
{/* 
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
            )} */}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="text-center pt-4 space-y-2">
            {/* <Button
              variant="ghost"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm"
            >
              {mode === 'signin' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
            </Button> */}

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

          {/* OAuth Sign Up */}
          <QuickAccessAuth />

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </a>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default QuickAccountSetup;
