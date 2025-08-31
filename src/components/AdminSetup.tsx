import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Crown, Zap } from 'lucide-react';

const AdminSetup: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const setupAdminAccess = async () => {
    if (!user) {
      toast({
        title: "Please log in first",
        description: "You need to be logged in to set up admin access.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create/update profile with unlimited plan
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          plan: 'unlimited',
          user_type: 'entity_owner',
          first_name: 'Admin',
          last_name: 'User',
          company: 'System Administrator',
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Grant admin role
      const { error: adminRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'admin',
          created_by: user.id
        });

      if (adminRoleError) throw adminRoleError;

      // Grant manager role
      const { error: managerRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'manager',
          created_by: user.id
        });

      if (managerRoleError) throw managerRoleError;

      // Grant user role
      const { error: userRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'user',
          created_by: user.id
        });

      if (userRoleError) throw userRoleError;

      // Refresh profile to get updated data
      await refreshProfile();

      toast({
        title: "Admin Access Granted! 🎉",
        description: "You now have unlimited access to all features.",
      });

    } catch (error: any) {
      console.error('Error setting up admin access:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to set up admin access. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAlreadyAdmin = profile?.is_admin || profile?.plan === 'unlimited';

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">Admin Access Setup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAlreadyAdmin ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Admin Access Active</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✅ Unlimited Plan: {profile?.plan === 'unlimited' ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-green-800">
                ✅ Admin Role: {profile?.is_admin ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-green-800">
                ✅ Roles: {profile?.roles?.join(', ') || 'None'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Unlimited Access Includes:</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Unlimited entities</li>
                <li>• All agent management features</li>
                <li>• Advanced analytics</li>
                <li>• Premium support</li>
                <li>• All future features</li>
              </ul>
            </div>
            
            <Button 
              onClick={setupAdminAccess}
              disabled={isLoading || !user}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              {isLoading ? 'Setting up...' : 'Grant Admin Access'}
            </Button>
          </div>
        )}

        {!user && (
          <p className="text-sm text-muted-foreground text-center">
            Please log in to set up admin access.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSetup;