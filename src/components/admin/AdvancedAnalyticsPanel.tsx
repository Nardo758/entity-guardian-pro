import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Shield, Activity } from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

const AdvancedAnalyticsPanel = () => {
  const { analytics, loading, error } = useAdvancedAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  const { userGrowthTrends, revenueAnalytics, complianceMetrics, systemPerformance, securityInsights } = analytics;

  const cohortData = Object.entries(revenueAnalytics.cohort_analysis).map(([period, retention]) => ({
    period,
    retention,
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Advanced Analytics</h2>
      
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{systemPerformance.uptime}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{systemPerformance.uptime}%</p>
              <p className="text-sm text-muted-foreground">System Uptime</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +15.7%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${(revenueAnalytics.mrr_trend[5] / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{userGrowthTrends[5]?.retention_rate}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{userGrowthTrends[5]?.retention_rate}%</p>
              <p className="text-sm text-muted-foreground">User Retention Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-green-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {securityInsights.security_score}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{securityInsights.security_score}</p>
              <p className="text-sm text-muted-foreground">Security Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth & Retention Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="new_users" fill="hsl(var(--primary))" name="New Users" />
                <Bar dataKey="churned_users" fill="hsl(var(--destructive))" name="Churned Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>MRR Growth & ARR Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueAnalytics.mrr_trend.map((value, index) => ({ 
                month: `Month ${index + 1}`, 
                mrr: value / 1000,
                arr_forecast: revenueAnalytics.arr_forecast[index] / 1000
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="mrr" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="MRR (K)"
                />
                <Line 
                  type="monotone" 
                  dataKey="arr_forecast" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="ARR Forecast (K)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cohort Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>User Retention Cohort Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="retention" fill="hsl(var(--accent))" name="Retention %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm text-green-600">{systemPerformance.uptime}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${systemPerformance.uptime}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm">{systemPerformance.response_time}ms</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(100, (500 - systemPerformance.response_time) / 5)}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-yellow-600">{systemPerformance.error_rate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${systemPerformance.error_rate * 10}%` }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Database Health</span>
                <span className="text-sm text-green-600">{systemPerformance.database_health}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${systemPerformance.database_health}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed Logins (24h)</span>
                <span className="text-sm font-semibold text-orange-600">
                  {securityInsights.failed_logins}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Suspicious Activities</span>
                <span className="text-sm font-semibold text-red-600">
                  {securityInsights.suspicious_activities}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vulnerabilities</span>
                <span className="text-sm font-semibold text-yellow-600">
                  {securityInsights.vulnerabilities}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Security Score</span>
                <span className="text-sm font-semibold text-green-600">
                  {securityInsights.security_score}/100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completion Rate</span>
                <span className="text-sm font-semibold text-green-600">
                  {complianceMetrics.completion_rate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Processing Time</span>
                <span className="text-sm font-semibold">
                  {complianceMetrics.average_processing_time} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overdue Items</span>
                <span className="text-sm font-semibold text-orange-600">
                  {complianceMetrics.overdue_items}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Risk Score</span>
                <span className="text-sm font-semibold text-blue-600">
                  {complianceMetrics.risk_score}/100
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPanel;