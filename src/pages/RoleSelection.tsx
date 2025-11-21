import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, UserCheck, Shield, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const RoleSelection = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user, refreshProfile, ensureProfileExists } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRoleSelection = async (userType: string, redirectPath: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(userType);
    
    try {
      // First ensure the profile exists with enhanced retry
      console.log('Ensuring profile exists for role assignment:', user.id);
      const profileExists = await ensureProfileExists(user.id);
      
      if (!profileExists) {
        throw new Error('Could not create or verify user profile after multiple attempts. Please contact support.');
      }

      console.log('Profile verified, updating role to:', userType);

      // Update user profile with selected role with retry logic and exponential backoff
      let updateSuccess = false;
      let lastError = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        console.log(`Role update attempt ${attempt + 1}/3`);
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            user_type: userType,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (!error) {
          updateSuccess = true;
          console.log('Role updated successfully');
          break;
        }

        lastError = error;
        console.warn(`Role update attempt ${attempt + 1} failed:`, error);
        
        // Wait before retry with exponential backoff (500ms, 1s, 2s)
        if (attempt < 2) {
          const delay = Math.pow(2, attempt) * 500;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (!updateSuccess) {
        console.error('Role update failed after all retries:', lastError);
        throw lastError || new Error('Failed to update profile after multiple attempts. Please try again.');
      }

      // Refresh profile to get updated data with retry
      console.log('Refreshing profile data...');
      let refreshSuccess = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await refreshProfile();
          refreshSuccess = true;
          console.log('Profile refreshed successfully');
          break;
        } catch (err) {
          console.warn(`Profile refresh attempt ${attempt + 1} failed:`, err);
          if (attempt < 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (!refreshSuccess) {
        console.warn('Profile refresh failed but role was updated');
      }

      // Additional delay to ensure state propagates
      await new Promise(resolve => setTimeout(resolve, 300));

      const roleLabel = userType === 'entity_owner' ? 'Business Owner' : 
                       userType === 'registered_agent' ? 'Registered Agent' : 
                       'Administrator';

      toast({
        title: "Role selected successfully! 🎉",
        description: `Welcome to Entity Renewal Pro as a ${roleLabel}!`,
      });

      console.log(`Navigating to: ${redirectPath}`);
      // Redirect to appropriate dashboard
      navigate(redirectPath, { replace: true });
    } catch (error: any) {
      console.error('Error in role selection:', error);
      toast({
        title: "Error selecting role",
        description: error.message || "An unexpected error occurred. Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-4">
            Complete Your Account Setup
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose your role to access the right features and dashboard for your needs
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {/* Entity Owner Card */}
          <Card className="relative border-2 hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Building className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Business Owner</CardTitle>
              <CardDescription className="text-sm">
                Manage business entities and find registered agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Manage multiple entities</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Find registered agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Track compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Document management</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handleRoleSelection('entity_owner', '/dashboard')}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {loading === 'entity_owner' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Select Role
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Registered Agent Card */}
          <Card className="relative border-2 hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserCheck className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Registered Agent</CardTitle>
              <CardDescription className="text-sm">
                Provide registered agent services to businesses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Professional profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Set your rates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Connect with clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Manage relationships</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handleRoleSelection('registered_agent', '/agent-dashboard')}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                {loading === 'registered_agent' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Select Role
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Administrator Card */}
          {/* <Card className="relative border-2 hover:border-primary/50 transition-all duration-300 shadow-xl hover:shadow-2xl group">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold">Administrator</CardTitle>
              <CardDescription className="text-sm">
                Manage system operations and user accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">System analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">User management</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Security oversight</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Configuration</span>
                </div>
              </div>
              
              <Button 
                onClick={() => handleRoleSelection('admin', '/admin-dashboard')}
                disabled={loading !== null}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {loading === 'admin' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Select Role
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card> */}
        </div>

        {/* Footer */}
        <div className="text-center pt-6">
          <p className="text-sm text-muted-foreground">
            Need help choosing the right role?{" "}
            <Button variant="link" className="p-0 h-auto text-primary hover:underline font-medium">
              Contact Support
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;