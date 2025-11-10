import React, { useState } from 'react';
import { useAdminMFA } from '@/hooks/useAdminMFA';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { AdminMFASetup } from './AdminMFASetup';

interface AdminMFAGuardProps {
  children: React.ReactNode;
}

export const AdminMFAGuard: React.FC<AdminMFAGuardProps> = ({ children }) => {
  const { isAdmin } = useAdminAccess();
  const { isMFAEnabled, requiresMFA, isLoading } = useAdminMFA();
  const [setupComplete, setSetupComplete] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Checking security requirements...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Non-admin users can proceed without MFA
  if (!isAdmin) {
    return <>{children}</>;
  }

  // Admin users must have MFA enabled
  if (requiresMFA && !setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-base">
              <strong>Enhanced Security Required:</strong> As an administrator, you must enable 
              Multi-Factor Authentication (MFA) to access admin features. This is a mandatory 
              security requirement to protect sensitive data and operations.
            </AlertDescription>
          </Alert>
          
          <AdminMFASetup onComplete={() => setSetupComplete(true)} />
        </div>
      </div>
    );
  }

  // MFA is enabled or setup just completed - allow access
  return <>{children}</>;
};

export default AdminMFAGuard;
