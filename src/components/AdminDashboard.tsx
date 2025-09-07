import React, { useState } from 'react';
import { Users, Shield, BarChart3, Settings, AlertTriangle, UserCog, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './dashboard/DashboardLayout';
import { UserAccount } from './UserAccount';
import { TeamSwitcher } from './TeamSwitcher';
import AdminRoleManager from './AdminRoleManager';
import SecurityAuditLog from './SecurityAuditLog';
import { SecurityWarningBanner } from './SecurityWarningBanner';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useSubscription } from '@/hooks/useSubscription';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeams } from '@/hooks/useTeams';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  const { subscription } = useSubscription();
  const { notifications } = useNotifications();
  const { currentTeam } = useTeams();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect non-admin users
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  // Calculate admin metrics (system-wide)
  const systemMetrics = {
    totalUsers: 0, // TODO: Implement system-wide user count
    activeSubscriptions: 0, // TODO: Implement system-wide subscription count
    systemAlerts: notifications.filter(n => !n.read).length,
    securityIssues: 1, // TODO: Implement actual security issue count
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4 flex-1">
            <Crown className="h-6 w-6 text-warning" />
            <div>
              <h1 className="text-xl font-bold text-foreground">System Administration</h1>
              <p className="text-sm text-muted-foreground">Manage users, security, and system settings</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <TeamSwitcher />
            <UserAccount />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-8">
          {/* Security Warning */}
          <SecurityWarningBanner />

          {/* Admin Status */}
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-warning" />
                <div>
                  <h3 className="font-semibold text-foreground">Administrator Access</h3>
                  <p className="text-sm text-muted-foreground">
                    You have full system administration privileges. Use with caution.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">Paying customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.systemAlerts}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Issues</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{systemMetrics.securityIssues}</div>
                <p className="text-xs text-muted-foreground">Active issues</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="security">Security & Audit</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Subscription Status</h4>
                      <Badge variant={subscription?.subscribed ? 'default' : 'secondary'}>
                        {subscription?.subscribed ? 'Active Subscription' : 'No active subscription'}
                      </Badge>
                    </div>
                    
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Current Team</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentTeam?.name || 'No team selected'}
                      </p>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('users')}
                          className="w-full justify-start"
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Manage Users
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('security')}
                          className="w-full justify-start"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Security Audit
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">System Health</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Database</span>
                          <Badge variant="default">Online</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>API</span>
                          <Badge variant="default">Online</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Storage</span>
                          <Badge variant="default">Online</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <AdminRoleManager />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecurityAuditLog />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Maintenance Mode</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Enable maintenance mode to perform system updates
                      </p>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Backup & Recovery</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Manage system backups and recovery settings
                      </p>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Backups
                      </Button>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">System Notifications</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Configure system-wide notification settings
                      </p>
                      <Button variant="outline" size="sm">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;