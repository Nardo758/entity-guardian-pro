import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, AlertTriangle } from 'lucide-react';

const SecureAdminAccess: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const requestPasswordReset = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });

      if (error) throw error;

      // Log access attempt for security monitoring
      await supabase.from('analytics_data').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        metric_name: 'Password Reset Request',
        metric_value: 1,
        metric_type: 'security_event',
        metric_date: new Date().toISOString().split('T')[0],
        metadata: {
          email: email,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_source: 'client_request'
        }
      });

      toast({
        title: "Password Reset Sent 📧",
        description: `If an account exists for ${email}, you'll receive a reset link`,
      });
      setEmail('');
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: "Unable to process password reset request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Security Warning */}
      <Card className="border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-destructive to-destructive/80 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive-foreground" />
          </div>
          <CardTitle className="text-xl font-bold text-destructive">
            🔒 Secure Access Only
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background/80 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              For security reasons, admin access is only available through secure password reset.
              No hardcoded credentials are permitted.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Secure Password Reset */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-lg">Account Recovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            onClick={requestPasswordReset}
            disabled={isLoading || !email}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Password Reset'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            A secure reset link will be sent to your email if an account exists.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureAdminAccess;