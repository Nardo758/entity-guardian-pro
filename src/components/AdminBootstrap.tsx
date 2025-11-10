import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminBootstrap } from '@/hooks/useAdminBootstrap';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export const AdminBootstrap = () => {
  const { user } = useAuth();
  const { bootstrapCurrentUser, bootstrapSpecificEmail, isBootstrapping } = useAdminBootstrap();
  const [targetEmail, setTargetEmail] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; locked?: boolean } | null>(null);

  const handleBootstrapSelf = async () => {
    setResult(null);
    const response = await bootstrapCurrentUser();
    setResult(response);
  };

  const handleBootstrapEmail = async () => {
    if (!targetEmail.trim()) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }
    setResult(null);
    const response = await bootstrapSpecificEmail(targetEmail);
    setResult(response);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle>Bootstrap First Admin</CardTitle>
        </div>
        <CardDescription>
          Create the first administrator account for this system. This can only be done once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current User Bootstrap */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Bootstrap Current User</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Make yourself ({user?.email}) the first admin user.
          </p>
          <Button 
            onClick={handleBootstrapSelf} 
            disabled={isBootstrapping}
            className="w-full"
          >
            {isBootstrapping ? 'Bootstrapping...' : 'Make Me Admin'}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Specific Email Bootstrap */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Bootstrap Specific User</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Make a specific user (by email) the first admin. The user must already be registered.
          </p>
          <div className="space-y-2">
            <Label htmlFor="target-email">User Email</Label>
            <Input
              id="target-email"
              type="email"
              placeholder="admin@example.com"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              disabled={isBootstrapping}
            />
          </div>
          <Button 
            onClick={handleBootstrapEmail} 
            disabled={isBootstrapping || !targetEmail.trim()}
            variant="secondary"
            className="w-full"
          >
            {isBootstrapping ? 'Bootstrapping...' : 'Make This User Admin'}
          </Button>
        </div>

        {/* Result Display */}
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.message}
              {result.locked && (
                <p className="mt-2 text-sm">
                  This system is locked. An admin user already exists. Contact your system administrator.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> This operation can only be performed once. After the first admin is created, this function will be locked and no additional admins can be bootstrapped through this method.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
