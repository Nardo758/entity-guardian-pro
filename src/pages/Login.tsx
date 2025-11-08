import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import QuickAccountSetup from "@/components/QuickAccountSetup";

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Handle redirects after login based on user type
  useEffect(() => {
    if (!loading && user && profile) {
      // If email/password user not verified yet, send to verification page
      const provider = (user as any)?.app_metadata?.provider;
      if (provider === 'email' && !user.email_confirmed_at) {
        navigate('/verify-email');
        return;
      }
      // Check if user has a role assigned
      if (!profile.user_type) {
        navigate('/role-selection');
        return;
      }

      // Redirect based on user type
      if (profile.user_type === 'registered_agent') {
        navigate('/agent-dashboard');
      } else if (profile.is_admin || profile.roles?.includes('admin')) {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);    

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity cursor-pointer">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold">Welcome to Entity Renewal Pro</h1>
          <p className="text-muted-foreground mt-2">Sign in to access your account</p>
        </div>

        {/* Quick Account Setup Component */}
        <QuickAccountSetup />
      </div>
    </div>
  );
};

export default Login;                                