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
      
      // Check if user has a role assigned
      if (!profile.user_type) {
        navigate('/role-selection', { replace: true });
        return;
      }

      // Only redirect if user is on a generic page, not already on a valid dashboard
      const validDashboards = ['/dashboard', '/admin-dashboard', '/agent-dashboard'];
      if (validDashboards.includes(currentPath)) {
        // Already on a valid dashboard, don't redirect
        return;
      }

      // Redirect based on user type for non-dashboard pages
      if (profile.user_type === 'registered_agent') {
        navigate('/agent-dashboard', { replace: true });
      } else if (profile.is_admin || profile.roles?.includes('admin')) {
        navigate('/admin-dashboard', { replace: true });
      } else if (profile.user_type === 'entity_owner') {
        navigate('/dashboard', { replace: true });
      }
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