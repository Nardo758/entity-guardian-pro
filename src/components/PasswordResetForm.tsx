import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetRequestSchema, type PasswordResetRequestFormData } from '@/lib/validations/auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface PasswordResetFormProps {
  onBack: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  const form = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: PasswordResetRequestFormData) => {
    // Check if locked out
    if (isLocked && lockoutTime) {
      const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000);
      if (remainingTime > 0) {
        toast({
          title: "Too Many Attempts",
          description: `Please try again in ${remainingTime} seconds.`,
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
      // Check rate limit first
      // Note: IP address will be extracted server-side from request headers for better security
      const { data: rateLimitData, error: rateLimitError } = await supabase.functions.invoke('rate-limiter', {
        body: {
          endpoint: 'auth',
          ipAddress: 'client' // Edge function will extract real IP from request headers
        }
      });

      if (rateLimitError || !rateLimitData?.allowed) {
        const retryAfter = rateLimitData?.retryAfter || 300;
        const lockoutEndTime = Date.now() + (retryAfter * 1000);
        setIsLocked(true);
        setLockoutTime(lockoutEndTime);

        toast({
          title: "Too Many Attempts",
          description: `Too many password reset requests. Please try again in ${retryAfter} seconds.`,
          variant: "destructive",
        });

        setTimeout(() => {
          setIsLocked(false);
          setLockoutTime(null);
        }, retryAfter * 1000);

        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setSentEmail(data.email);
        setIsEmailSent(true);
        toast({
          title: "Reset Email Sent! 📧",
          description: "Check your email for password reset instructions.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Check Your Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">📧</div>
          <p className="text-muted-foreground">
            We've sent password reset instructions to <strong>{sentEmail}</strong>
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Reset Password</CardTitle>
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

            {isLocked && lockoutTime && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Too Many Attempts</AlertTitle>
                <AlertDescription>
                  Too many password reset requests. Please try again in {Math.ceil((lockoutTime - Date.now()) / 1000)} seconds.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full"
            >
              {isLoading ? 'Sending...' : isLocked ? 'Temporarily Locked' : 'Send Reset Email'}
            </Button>
          </form>
        </Form>

        <Button onClick={onBack} variant="ghost" className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sign In
        </Button>

      </CardContent>
    </Card>
  );
};

export default PasswordResetForm;
