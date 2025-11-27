import React from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp,
  Activity,
  Shield,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { admin } = useAdminAuth();
  const { metrics, loading: isLoading } = useAdminAnalytics();

  const stats = [
    {
      title: 'Total Users',
      value: metrics?.userAnalytics?.total_users || 0,
      change: `+${metrics?.userAnalytics?.user_growth_30d || 0} this month`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Entities',
      value: metrics?.entityAnalytics?.total_entities || 0,
      change: `+${metrics?.entityAnalytics?.entity_creation_rate_30d || 0} this month`,
      icon: Building2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Revenue',
      value: `$${((metrics?.financialAnalytics?.total_revenue || 0) / 100).toLocaleString()}`,
      change: `${metrics?.financialAnalytics?.revenue_growth_rate || 0}% growth`,
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'System Health',
      value: `${metrics?.operationalAnalytics?.system_uptime_percentage || 99.9}%`,
      change: 'Uptime',
      icon: Activity,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {admin?.displayName}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {format(new Date(), 'PPp')}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {isLoading ? '...' : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Quick Stats</CardTitle>
            <CardDescription className="text-muted-foreground">
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Active Subscribers</span>
              <span className="text-foreground font-medium">
                {metrics?.userAnalytics?.total_users || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">MRR</span>
              <span className="text-foreground font-medium">
                ${((metrics?.financialAnalytics?.mrr || 0)).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Trial Conversion Rate</span>
              <span className="text-foreground font-medium">
                {metrics?.userAnalytics?.trial_to_paid_conversion || 0}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Compliance Rate</span>
              <span className="text-foreground font-medium">
                {metrics?.operationalAnalytics?.compliance_completion_rate || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Security Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Overview
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              System security status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Security Incidents (30d)</span>
              <span className="text-foreground font-medium">
                {metrics?.operationalAnalytics?.security_incidents || 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Failed Login Attempts</span>
              <span className="text-foreground font-medium">-</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Blocked IPs</span>
              <span className="text-foreground font-medium">-</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Admin Sessions Active</span>
              <span className="text-success font-medium">1</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
