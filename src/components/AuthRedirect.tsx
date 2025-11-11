import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRedirectProps {
  children: React.ReactNode;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      const currentPath = window.location.pathname;
      console.log('AuthRedirect - Current path:', currentPath, 'User type:', profile.user_type, 'Is admin:', profile.is_admin);
      
      // Check if user has a role assigned
      if (!profile.user_type) {
        console.log('No user type, redirecting to role selection');
        navigate('/role-selection', { replace: true });
        return;
      }

      // Redirect based on user type - avoid infinite redirects by checking current path
      if (profile.user_type === 'registered_agent' && currentPath !== '/agent-dashboard') {
        console.log('Redirecting registered agent to dashboard');
        navigate('/agent-dashboard', { replace: true });
      } else if (profile.is_admin && currentPath !== '/admin-dashboard') {
        console.log('Redirecting admin to dashboard');
        navigate('/admin-dashboard', { replace: true });
      } else if (profile.user_type === 'entity_owner' && currentPath !== '/dashboard') {
        console.log('Redirecting entity owner to dashboard');
        navigate('/dashboard', { replace: true });
      }
    } else if (!loading && user && !profile) {
      console.log('User exists but no profile loaded yet');
    }
  }, [user, profile, loading, navigate]);

  // Show loading state while determining redirect
  if (loading || (user && profile && !profile.user_type)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthRedirect;