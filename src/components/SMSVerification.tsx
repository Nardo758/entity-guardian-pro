import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SMSVerificationProps {
  onVerificationComplete?: (phoneNumber: string) => void;
}

export const SMSVerification: React.FC<SMSVerificationProps> = ({ 
  onVerificationComplete 
}) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 10) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    } else if (digits.length >= 7) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    } else if (digits.length >= 4) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    } else if (digits.length >= 1) {
      return `+1 (${digits.slice(1)}`;
    }
    return '+1 ';
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate phone number
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length !== 11 || !digits.startsWith('1')) {
        throw new Error('Please enter a valid US phone number');
      }

      const formattedPhone = `+${digits}`;

      const { data, error } = await supabase.functions.invoke('sms-verification', {
        body: {
          phone: formattedPhone,
          action: 'send'
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(data.message || 'Verification code sent!');
      
      // If in development mode, show the code
      if (data.code) {
        toast.info(`Development mode - Code: ${data.code}`);
      }
      
      setStep('code');
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (verificationCode.length !== 6) {
        throw new Error('Please enter the 6-digit verification code');
      }

      const digits = phoneNumber.replace(/\D/g, '');
      const formattedPhone = `+${digits}`;

      const { data, error } = await supabase.functions.invoke('sms-verification', {
        body: {
          phone: formattedPhone,
          action: 'verify',
          code: verificationCode
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Phone number verified successfully!');
      onVerificationComplete?.(formattedPhone);
      
    } catch (error) {
      console.error('Error verifying code:', error);
      setError(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setStep('phone');
    setVerificationCode('');
    setError('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>
          {step === 'phone' ? 'Verify Phone Number' : 'Enter Verification Code'}
        </CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'We\'ll send you a 6-digit verification code' 
            : `Code sent to ${phoneNumber}`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                maxLength={18}
                required
              />
              <p className="text-sm text-muted-foreground">
                US phone numbers only
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || phoneNumber.length < 18}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Verify Phone Number
                  </>
                )}
              </Button>
            </form>
            
            <div className="text-center">
              <Button 
                variant="link" 
                onClick={handleResendCode}
                className="text-sm"
              >
                Didn't receive the code? Try again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};