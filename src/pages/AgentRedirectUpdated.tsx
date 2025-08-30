import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import EntityOwnerDashboard from '@/components/EntityOwnerDashboard';
import { Card, CardContent } from '@/components/ui/card';

const AgentRedirectUpdated: React.FC = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      if (profile.user_type === 'agent') {
        navigate('/agent-dashboard', { replace: true });
      }
      // If entity owner, stay on this page and show EntityOwnerDashboard
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If entity owner or no user type set, show the main dashboard
  return <EntityOwnerDashboard />;
};

export default AgentRedirectUpdated;