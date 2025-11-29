import React from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, User, Shield, Clock, Crown } from 'lucide-react';

const Settings: React.FC = () => {
  const { admin } = useAdminAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your admin account settings</p>
        </div>
        {admin?.isSiteOwner && (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 flex items-center gap-1.5 px-3 py-1.5">
            <Crown className="h-4 w-4" />
            Site Owner
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your admin account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Display Name</span>
              <span className="text-foreground font-medium">{admin?.displayName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground font-medium">{admin?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Admin ID</span>
              <span className="text-muted-foreground font-mono text-sm">{admin?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Permissions</span>
              <div className="flex gap-2">
                {admin?.permissions?.map((perm) => (
                  <Badge key={perm} className="bg-primary/20 text-primary">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Site Owner Status</span>
              <Badge className={admin?.isSiteOwner ? 'bg-amber-500/20 text-amber-600' : 'bg-muted text-muted-foreground'}>
                {admin?.isSiteOwner ? 'Site Owner' : 'Administrator'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Security configuration for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">MFA Status</span>
              <Badge className={admin?.mfaEnabled ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                {admin?.mfaEnabled ? 'Enabled' : 'Not Configured'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Session Duration</span>
              <span className="text-foreground font-medium">4 hours</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Session Storage</span>
              <span className="text-muted-foreground text-sm">Session only (clears on browser close)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Session Information
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Current session details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Your admin session is stored in browser session storage and will automatically expire after 4 hours of inactivity or when you close your browser.
              </p>
              <p className="text-sm text-muted-foreground">
                For security, admin sessions are not persisted across browser sessions. You will need to log in again after closing your browser.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
