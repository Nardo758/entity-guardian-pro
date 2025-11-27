import React from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, User, Shield, Clock } from 'lucide-react';

const Settings: React.FC = () => {
  const { admin } = useAdminAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your admin account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-amber-500" />
              Account Information
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your admin account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Display Name</span>
              <span className="text-white font-medium">{admin?.displayName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Email</span>
              <span className="text-white font-medium">{admin?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Admin ID</span>
              <span className="text-slate-500 font-mono text-sm">{admin?.id?.slice(0, 8)}...</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Permissions</span>
              <div className="flex gap-2">
                {admin?.permissions?.map((perm) => (
                  <Badge key={perm} className="bg-amber-500/20 text-amber-400">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Security Settings
            </CardTitle>
            <CardDescription className="text-slate-400">
              Security configuration for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">MFA Status</span>
              <Badge className={admin?.mfaEnabled ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}>
                {admin?.mfaEnabled ? 'Enabled' : 'Not Configured'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Session Duration</span>
              <span className="text-white font-medium">4 hours</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Session Storage</span>
              <span className="text-slate-500 text-sm">Session only (clears on browser close)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Session Information
            </CardTitle>
            <CardDescription className="text-slate-400">
              Current session details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-2">
                Your admin session is stored in browser session storage and will automatically expire after 4 hours of inactivity or when you close your browser.
              </p>
              <p className="text-sm text-slate-500">
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
