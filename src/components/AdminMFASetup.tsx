import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Smartphone, 
  Key, 
  CheckCircle, 
  Copy,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAdminMFA } from '@/hooks/useAdminMFA';

// Generate cryptographically secure recovery codes
const generateRecoveryCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomValues = new Uint8Array(6);
    crypto.getRandomValues(randomValues);
    const code = Array.from(randomValues)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join('-') || '';
    codes.push(code);
  }
  return codes;
};

// Hash recovery code for secure storage
const hashRecoveryCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

interface AdminMFASetupProps {
  onComplete?: () => void;
}

export const AdminMFASetup: React.FC<AdminMFASetupProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refetchMFAStatus } = useAdminMFA();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const setupTOTP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Admin Authenticator App'
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('verify');
        
        toast({
          title: "MFA Setup Initiated",
          description: "Scan the QR code with your authenticator app.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up authenticator. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode,
      });

      if (error) throw error;

      // Generate recovery codes
      const codes = generateRecoveryCodes(10);
      setRecoveryCodes(codes);

      // Store hashed recovery codes in database
      if (user) {
        const hashedCodes = await Promise.all(
          codes.map(async (code) => ({
            user_id: user.id,
            code_hash: await hashRecoveryCode(code)
          }))
        );

        const { error: codesError } = await supabase
          .from('mfa_recovery_codes')
          .insert(hashedCodes);

        if (codesError) {
          console.error('Failed to store recovery codes:', codesError);
        }

        // Log the MFA setup
        await supabase.from('analytics_data').insert({
          user_id: user.id,
          metric_type: 'security_event',
          metric_name: 'admin_mfa_enabled',
          metric_value: 1,
          metric_date: new Date().toISOString().split('T')[0],
          metadata: {
            method: 'totp',
            timestamp: new Date().toISOString(),
            role: 'admin',
            recovery_codes_generated: codes.length
          }
        });
      }

      await refetchMFAStatus();
      setStep('complete');
      
      toast({
        title: "MFA Enabled Successfully",
        description: "Two-factor authentication is now active. Save your recovery codes!",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
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
      description: "Secret key copied to clipboard",
    });
  };

  if (step === 'setup') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            Admin MFA Setup Required
          </CardTitle>
          <CardDescription>
            Set up Multi-Factor Authentication to secure your admin account and protect sensitive operations.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              <strong>Before you begin:</strong> Install an authenticator app on your mobile device
              such as Google Authenticator, Authy, Microsoft Authenticator, or 1Password.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="font-semibold">Why is MFA required for admins?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Protects sensitive user data and system configurations</li>
              <li>Prevents unauthorized access to admin functions</li>
              <li>Meets security compliance requirements</li>
              <li>Adds an extra layer of protection beyond passwords</li>
            </ul>
          </div>

          <Separator />

          <Button 
            onClick={setupTOTP} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Setting Up...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 mr-2" />
                Set Up Authenticator App
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Scan QR Code
          </CardTitle>
          <CardDescription>
            Use your authenticator app to scan the QR code below or enter the secret key manually.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {qrCode && (
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-lg border-2 border-border">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Manual Entry Key</Label>
            <div className="flex gap-2">
              <Input value={secret} readOnly className="font-mono text-xs" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(secret)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If you can't scan the QR code, enter this key manually in your authenticator app.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code shown in your authenticator app
            </p>
          </div>

          <Button 
            onClick={verifyTOTP} 
            disabled={loading || verificationCode.length !== 6}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Verify & Enable MFA
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            MFA Successfully Enabled
          </CardTitle>
          <CardDescription>
            Your admin account is now protected with two-factor authentication.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-green-500/50 bg-green-500/10">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              <strong>Success!</strong> You can now access admin features securely. 
              You'll need to enter a code from your authenticator app when signing in.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive" className="border-destructive/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>IMPORTANT:</strong> Save these recovery codes now! They are your only backup
              if you lose access to your authenticator app. Each code can only be used once.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Recovery Codes</Label>
            <p className="text-sm text-muted-foreground">
              Store these codes in a secure location. You can use them to access your account
              if you lose your authenticator device.
            </p>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg border-2 border-border">
              {recoveryCodes.map((code, index) => (
                <div 
                  key={index} 
                  className="font-mono text-sm p-2 bg-background rounded border text-center"
                >
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(recoveryCodes.join('\n'));
                  toast({
                    title: "Copied",
                    description: "Recovery codes copied to clipboard",
                  });
                }}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Codes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const text = recoveryCodes.join('\n');
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'mfa-recovery-codes.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({
                    title: "Downloaded",
                    description: "Recovery codes saved to file",
                  });
                }}
                className="flex-1"
              >
                Download Codes
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Security Reminders:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Keep your authenticator app secure and backed up</li>
              <li>Store recovery codes in a password manager or secure location</li>
              <li>Each recovery code works only once - don't reuse them</li>
              <li>Don't share codes or authenticator access with anyone</li>
              <li>You can regenerate codes anytime from Settings</li>
            </ul>
          </div>

          <Separator />

          <div className="flex justify-center">
            <Button onClick={onComplete} size="lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Saved My Codes - Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default AdminMFASetup;
