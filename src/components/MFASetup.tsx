import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Mail, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  Copy,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MFASetupProps {
  onComplete?: () => void;
}

interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email';
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'setup' | 'verify' | 'complete'>('select');
  const [selectedMethod, setSelectedMethod] = useState<MFAMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');

  const mfaMethods: MFAMethod[] = [
    {
      id: 'totp',
      type: 'totp',
      name: 'Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar TOTP apps',
      icon: Smartphone,
      enabled: true
    },
    {
      id: 'sms',
      type: 'sms',
      name: 'SMS Text Message',
      description: 'Receive verification codes via SMS',
      icon: Smartphone,
      enabled: true
    },
    {
      id: 'email',
      type: 'email',
      name: 'Email Verification',
      description: 'Receive verification codes via email',
      icon: Mail,
      enabled: true
    }
  ];

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const setupTOTP = async () => {
    setLoading(true);
    try {
      // Generate secret key for TOTP
      const secret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setSecretKey(secret);
      
      // Generate QR code URL (in real implementation, use proper QR library)
      const qrUrl = `otpauth://totp/EntityRenewalPro:${user?.email}?secret=${secret}&issuer=EntityRenewalPro`;
      setQrCode(qrUrl);
      
      setStep('setup');
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to set up authenticator app. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupSMS = async () => {
    setLoading(true);
    try {
      // In real implementation, this would send SMS verification
      toast({
        title: "SMS Setup",
        description: "SMS verification will be sent to your phone number.",
      });
      setStep('verify');
    } catch (error) {
      toast({
        title: "Setup Failed", 
        description: "Failed to set up SMS verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupEmail = async () => {
    setLoading(true);
    try {
      // In real implementation, this would send email verification
      toast({
        title: "Email Setup",
        description: "Verification code sent to your email address.",
      });
      setStep('verify');
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to set up email verification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSetup = async (method: MFAMethod) => {
    setSelectedMethod(method);
    
    switch (method.type) {
      case 'totp':
        await setupTOTP();
        break;
      case 'sms':
        await setupSMS();
        break;
      case 'email':
        await setupEmail();
        break;
    }
  };

  const verifyMFA = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Verification Required",
        description: "Please enter the verification code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // In real implementation, verify the code with backend
      const isValid = verificationCode === '123456'; // Mock validation
      
      if (isValid) {
        // Generate backup codes
        const codes = generateBackupCodes();
        setBackupCodes(codes);
        
        // Store MFA setup in database
        if (user) {
          await supabase.from('analytics_data').insert({
            user_id: user.id,
            metric_type: 'security_event',
            metric_name: 'mfa_enabled',
            metric_value: 1,
            metric_date: new Date().toISOString().split('T')[0],
            metadata: {
              method: selectedMethod?.type,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        setStep('complete');
        toast({
          title: "MFA Enabled Successfully",
          description: "Two-factor authentication has been set up for your account.",
        });
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Failed to verify the code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const resetSetup = () => {
    setStep('select');
    setSelectedMethod(null);
    setVerificationCode('');
    setQrCode('');
    setSecretKey('');
    setBackupCodes([]);
  };

  if (step === 'select') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Set Up Two-Factor Authentication
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account by enabling two-factor authentication.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {mfaMethods.map((method) => (
            <Card key={method.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <method.icon className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleMethodSetup(method)}
                    disabled={loading || !method.enabled}
                    size="sm"
                  >
                    Set Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (step === 'setup' && selectedMethod?.type === 'totp') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Set Up Authenticator App
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Scan the QR code with your authenticator app or enter the secret key manually.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="w-48 h-48 mx-auto border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center mb-4">
              <p className="text-sm text-muted-foreground">QR Code would appear here</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan this QR code with Google Authenticator, Authy, or similar app
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Manual Entry Key</Label>
            <div className="flex gap-2">
              <Input value={secretKey} readOnly className="font-mono" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(secretKey)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If you can't scan the QR code, enter this key manually in your authenticator app.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetSetup}>
              Back
            </Button>
            <Button onClick={() => setStep('verify')} className="flex-1">
              Continue to Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Verify Your Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the verification code from your {selectedMethod?.name.toLowerCase()}.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              For demo purposes, use code <strong>123456</strong> to complete verification.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button variant="outline" onClick={resetSetup}>
              Back
            </Button>
            <Button 
              onClick={verifyMFA} 
              disabled={loading || !verificationCode}
              className="flex-1"
            >
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              Verify & Enable MFA
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            MFA Successfully Enabled
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your account is now protected with two-factor authentication.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Save these backup codes in a secure location. 
              You can use them to access your account if your primary MFA method is unavailable.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Backup Recovery Codes</Label>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-muted rounded border text-center">
                  {code}
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All Backup Codes
            </Button>
          </div>

          <div className="flex justify-center">
            <Button onClick={onComplete}>
              Complete Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default MFASetup;