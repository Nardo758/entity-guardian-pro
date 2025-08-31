import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, Zap, Shield } from 'lucide-react';

const DirectAdminAccess: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createTestAdminAccount = async () => {
    setIsLoading(true);
    const testEmail = 'admin@entitypro.com';
    const testPassword = 'AdminPass123!';

    try {
      // First try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: 'Admin',
            last_name: 'User',
            company: 'Entity Renewal Pro'
          }
        }
      });

      if (signUpError && !signUpError.message.includes('already been registered')) {
        throw signUpError;
      }

      // Then try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        throw signInError;
      }

      toast({
        title: "Admin Access Granted! 🎉",
        description: "You're now signed in as admin@entitypro.com",
      });

      // Force page refresh to ensure proper state
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error: any) {
      console.error('Admin access error:', error);
      toast({
        title: "Setup Issue",
        description: `Error: ${error.message}. Try using the password reset option.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetExistingAccount = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent! 📧",
        description: `Password reset sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Instant Admin Access */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-purple-800">
            🚀 Instant Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/80 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <Zap className="h-4 w-4" />
              <span className="font-semibold">Creates: admin@entitypro.com</span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <Shield className="h-4 w-4" />
              <span className="font-semibold">Password: AdminPass123!</span>
            </div>
            <p className="text-xs text-gray-600">
              Creates account, signs you in, and redirects to dashboard
            </p>
          </div>
          
          <Button 
            onClick={createTestAdminAccount}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? 'Setting up...' : '⚡ Get Instant Admin Access'}
          </Button>
        </CardContent>
      </Card>

      {/* Reset Existing Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reset Existing Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you're one of these existing users, reset your password:
          </p>
          
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => resetExistingAccount('leon@traveloure.com')}
              className="w-full justify-start text-xs"
            >
              Reset: leon@traveloure.com
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => resetExistingAccount('m.dixon5030@gmail.com')}
              className="w-full justify-start text-xs"
            >
              Reset: m.dixon5030@gmail.com
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => resetExistingAccount('ldixon@myersapartmentgroup.com')}
              className="w-full justify-start text-xs"
            >
              Reset: ldixon@myersapartmentgroup.com
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectAdminAccess;