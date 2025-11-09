import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff, RotateCcw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuickAccessAuth from './QuickAccessAuth';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const LoginForm: React.FC = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleResendVerification = async () => {
    const email = form.getValues('email');
    
    if (!email) {
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
        email: email,
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

  const onSubmit = async (data: LoginFormData) => {
    // Check if locked out
    if (isLocked && lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      if (remainingTime > 0) {
        toast({
          title: "Account Temporarily Locked",
          description: `Too many failed attempts. Please try again in ${remainingTime} seconds.`,
          variant: "destructive",
        });
        return;
      } else {
        setIsLocked(false);
        setLockoutTime(null);
      }
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        // Handle rate limiting
        if ((error as any).rateLimited || (error as any).retryAfter) {
          const retryAfter = (error as any).retryAfter || 300;
          const lockoutEndTime = Date.now() + (retryAfter * 1000);
          setIsLocked(true);
          setLockoutTime(lockoutEndTime);
          
          toast({
            title: "Too Many Attempts",
            description: error.message || `Account temporarily locked. Please try again in ${retryAfter} seconds.`,
            variant: "destructive",
          });
          
          // Auto-unlock after timeout
          setTimeout(() => {
            setIsLocked(false);
            setLockoutTime(null);
          }, retryAfter * 1000);
          
          return;
        }

        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Welcome! 🎉",
          description: "Successfully signed in.",
        });
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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <p className="text-muted-foreground mt-2">Welcome back! Please sign in to continue.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLocked && lockoutTime && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Account Temporarily Locked</AlertTitle>
                <AlertDescription>
                  Too many failed login attempts. Please try again in {Math.ceil((lockoutTime - Date.now()) / 1000)} seconds.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : isLocked ? 'Account Locked' : 'Sign In'}
            </Button>
          </form>
        </Form>

        <div className="text-center pt-2 space-y-2">
          <div className="flex flex-col gap-2">
            <Link to="/reset-password">
              <Button
                variant="ghost"
                type="button"
                className="text-sm w-full"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Forgot Password?
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleResendVerification}
              disabled={isLoading}
              className="text-sm"
            >
              <Mail className="h-4 w-4 mr-1" />
              Resend Verification Email
            </Button>
          </div>
        </div>

        <QuickAccessAuth />

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create one now
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
