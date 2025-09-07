import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import QuickAccountSetup from "@/components/QuickAccountSetup";

const Login = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Handle redirects after login based on user type
  useEffect(() => {
    if (!loading && user && profile) {
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
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Building className="h-8 w-8 text-primary-foreground" />
          </div>
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