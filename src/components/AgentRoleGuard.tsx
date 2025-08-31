import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AgentRoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'registered_agent' | 'entity_owner';
  fallbackPath?: string;
}

const AgentRoleGuard: React.FC<AgentRoleGuardProps> = ({ 
  children, 
  requiredRole = 'registered_agent',
  fallbackPath = '/dashboard' 
}) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userRole = profile?.user_type || 'entity_owner';
  
  if (userRole !== requiredRole) {
    const message = requiredRole === 'registered_agent' 
      ? 'This page is only available to registered agents.'
      : 'This page is only available to entity owners.';
      
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-2" />
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{message}</p>
            <Button 
              onClick={() => navigate(fallbackPath)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AgentRoleGuard;