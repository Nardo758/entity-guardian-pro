import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  FileText, 
  Users,
  Building2,
  Clock
} from 'lucide-react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useEntities } from '@/hooks/useEntities';
import { usePayments } from '@/hooks/usePayments';
import NavigationMenu from '@/components/NavigationMenu';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { UserAccount } from '@/components/UserAccount';
import { RealTimeNotifications } from '@/components/RealTimeNotifications';

export const EnhancedDashboard: React.FC = () => {
  const { permissions } = useRolePermissions();
  const { entities } = useEntities();
  const { payments } = usePayments();

  const totalEntities = entities?.length || 0;
  const pendingPayments = payments?.filter(p => p.status === 'pending')?.length || 0;
  const totalRevenue = payments?.filter(p => p.status === 'paid')
    ?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const upcomingDeadlines = entities?.filter(entity => {
    const dueDate = entity.registered_agent_fee_due_date;
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-2">
          <RealTimeNotifications />
          <TeamSwitcher />
          <UserAccount />
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Quick Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Entities</p>
                <p className="text-2xl font-bold text-foreground">{totalEntities}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-foreground">{pendingPayments}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {pendingPayments > 0 ? 'Needs attention' : 'All up to date'}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">1,247</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 5).map((entity) => {
                  const dueDate = new Date(entity.registered_agent_fee_due_date!);
                  const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={entity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{entity.name}</p>
                        <p className="text-sm text-muted-foreground">Registered Agent Fee</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={daysUntil <= 7 ? "destructive" : "secondary"}>
                          {daysUntil} days
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {dueDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Building2 className="w-4 h-4 mr-2" />
              Add New Entity
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Process Payment
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Reminder
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Annual Reports</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tax Filings</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Renewals</span>
                <span className="text-sm text-muted-foreground">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};