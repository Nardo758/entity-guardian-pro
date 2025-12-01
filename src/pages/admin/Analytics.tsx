import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  DollarSign, 
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  Percent,
  Clock
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}: {typeof entry.value === 'number' && entry.value > 100 
              ? formatCurrency(entry.value) 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics: React.FC = () => {
  const { metrics, loading: isLoading, refetch, exportReport } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userAnalytics = metrics?.userAnalytics;
  const financialAnalytics = metrics?.financialAnalytics;
  const entityAnalytics = metrics?.entityAnalytics;
  const operationalAnalytics = metrics?.operationalAnalytics;
  const businessIntelligence = metrics?.businessIntelligence;

  // Prepare chart data
  const roleDistributionData = userAnalytics?.users_by_role 
    ? Object.entries(userAnalytics.users_by_role).map(([name, value]) => ({ name: name || 'Unknown', value }))
    : [];

  const revenueTierData = financialAnalytics?.revenue_by_tier
    ? Object.entries(financialAnalytics.revenue_by_tier).map(([name, value]) => ({ name, value }))
    : [];

  const entityTypeData = entityAnalytics?.entities_by_type
    ? Object.entries(entityAnalytics.entities_by_type).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
    : [];

  const stateDistributionData = entityAnalytics?.entities_by_state
    ? Object.entries(entityAnalytics.entities_by_state)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))
    : [];

  const churnRiskData = businessIntelligence?.churn_risk_indicators
    ? [
        { name: 'High Risk', value: businessIntelligence.churn_risk_indicators.high_risk, color: 'hsl(var(--destructive))' },
        { name: 'Medium Risk', value: businessIntelligence.churn_risk_indicators.medium_risk, color: 'hsl(var(--warning))' },
        { name: 'Low Risk', value: businessIntelligence.churn_risk_indicators.low_risk, color: 'hsl(var(--success))' },
      ]
    : [];

  const revenueForecastData = financialAnalytics?.revenue_forecast
    ? Object.entries(financialAnalytics.revenue_forecast).map(([month, value]) => ({ month, revenue: value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Business intelligence and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">
                  {userAnalytics?.total_users || 0}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {(userAnalytics?.user_growth_30d || 0) > 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span className={`text-xs ${(userAnalytics?.user_growth_30d || 0) > 0 ? 'text-success' : 'text-destructive'}`}>
                    {userAnalytics?.user_growth_30d || 0} this month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(financialAnalytics?.mrr || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ARR: {formatCurrency(financialAnalytics?.arr || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <Building2 className="h-6 w-6 text-info" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Entities</p>
                <p className="text-2xl font-bold text-foreground">
                  {entityAnalytics?.total_entities || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {entityAnalytics?.avg_entities_per_customer?.toFixed(1) || 0} avg per user
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Target className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {userAnalytics?.trial_to_paid_conversion || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Trial to paid
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="entities" className="gap-2">
            <Building2 className="h-4 w-4" />
            Entities
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Activity className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">7-Day Growth</span>
                  <Badge variant="secondary">+{userAnalytics?.user_growth_7d || 0}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Retention Rate</span>
                  <Badge variant="secondary">{userAnalytics?.user_retention_rate || 0}%</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upgrade Rate</span>
                  <Badge variant="secondary">{userAnalytics?.upgrade_rate || 0}%</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Downgrade Rate</span>
                  <Badge variant="destructive">{userAnalytics?.downgrade_rate || 0}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution by Role</CardTitle>
                <CardDescription>Breakdown of users across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                {roleDistributionData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {roleDistributionData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Metrics Summary</CardTitle>
                <CardDescription>Key user performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Trial Conversion</span>
                      <span className="font-medium">{userAnalytics?.trial_to_paid_conversion || 0}%</span>
                    </div>
                    <Progress value={userAnalytics?.trial_to_paid_conversion || 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">User Retention</span>
                      <span className="font-medium">{userAnalytics?.user_retention_rate || 0}%</span>
                    </div>
                    <Progress value={userAnalytics?.user_retention_rate || 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Upgrade Rate</span>
                      <span className="font-medium">{userAnalytics?.upgrade_rate || 0}%</span>
                    </div>
                    <Progress value={userAnalytics?.upgrade_rate || 0} />
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Role Distribution</h4>
                    {userAnalytics?.users_by_role && 
                      Object.entries(userAnalytics.users_by_role).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground capitalize">{role || 'Unknown'}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="font-bold">{formatCurrency((financialAnalytics?.total_revenue || 0) / 100)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ARPU</span>
                  <span className="font-bold">{formatCurrency(financialAnalytics?.arpu || 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Outstanding</span>
                  <span className="font-bold">{formatCurrency(financialAnalytics?.outstanding_invoices || 0)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Growth Rate</span>
                  <Badge variant={financialAnalytics?.revenue_growth_rate && financialAnalytics.revenue_growth_rate > 0 ? 'default' : 'destructive'}>
                    {financialAnalytics?.revenue_growth_rate || 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Tier</CardTitle>
                <CardDescription>Revenue distribution across subscription tiers</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueTierData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueTierData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Projected revenue for upcoming months</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueForecastData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueForecastData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No forecast data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Creation Rate (30d)</span>
                  <Badge variant="secondary">+{entityAnalytics?.entity_creation_rate_30d || 0}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deletion Rate (30d)</span>
                  <Badge variant="destructive">-{entityAnalytics?.entity_deletion_rate_30d || 0}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Popular Type</span>
                  <Badge variant="outline" className="capitalize">
                    {entityAnalytics?.most_popular_entity_type?.replace('_', ' ') || 'N/A'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Popular State</span>
                  <Badge variant="outline">{entityAnalytics?.most_popular_state || 'N/A'}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entities by Type</CardTitle>
                <CardDescription>Distribution of entity types</CardDescription>
              </CardHeader>
              <CardContent>
                {entityTypeData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={entityTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {entityTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top States</CardTitle>
                <CardDescription>Entity distribution by state (Top 10)</CardDescription>
              </CardHeader>
              <CardContent>
                {stateDistributionData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stateDistributionData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" className="text-muted-foreground" tick={{ fontSize: 12 }} width={40} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Compliance Rate</p>
                    <p className="text-xl font-bold">{operationalAnalytics?.compliance_completion_rate || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-info" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Processing</p>
                    <p className="text-xl font-bold">{operationalAnalytics?.avg_processing_time_days || 0} days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-sm text-muted-foreground">Support Tickets</p>
                    <p className="text-xl font-bold">{operationalAnalytics?.support_ticket_volume || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">System Uptime</p>
                    <p className="text-xl font-bold">{operationalAnalytics?.system_uptime_percentage || 99.9}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operational Metrics</CardTitle>
                <CardDescription>Key operational performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Completion</span>
                      <span className="font-medium">{operationalAnalytics?.compliance_completion_rate || 0}%</span>
                    </div>
                    <Progress value={operationalAnalytics?.compliance_completion_rate || 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">System Uptime</span>
                      <span className="font-medium">{operationalAnalytics?.system_uptime_percentage || 99.9}%</span>
                    </div>
                    <Progress value={operationalAnalytics?.system_uptime_percentage || 99.9} className="h-2" />
                  </div>
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Failed Renewals (30d)</span>
                      <Badge variant="destructive">{operationalAnalytics?.failed_renewals_30d || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Document Volume</span>
                      <Badge variant="secondary">{operationalAnalytics?.document_processing_volume || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Security Incidents</span>
                      <Badge variant={operationalAnalytics?.security_incidents ? 'destructive' : 'default'}>
                        {operationalAnalytics?.security_incidents || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Database and API performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Database Performance</h4>
                  {operationalAnalytics?.database_performance_metrics && 
                    Object.entries(operationalAnalytics.database_performance_metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{value as number}</Badge>
                      </div>
                    ))
                  }
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-3">API Usage Patterns</h4>
                    {operationalAnalytics?.api_usage_patterns && 
                      Object.entries(operationalAnalytics.api_usage_patterns).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-1">
                          <span className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <Badge variant="outline">{value as number}</Badge>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Business Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                    <p className="text-xl font-bold">{businessIntelligence?.customer_satisfaction_score || 0}/10</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm text-muted-foreground">High Churn Risk</p>
                    <p className="text-xl font-bold">{businessIntelligence?.churn_risk_indicators?.high_risk || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm text-muted-foreground">Low Churn Risk</p>
                    <p className="text-xl font-bold">{businessIntelligence?.churn_risk_indicators?.low_risk || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Distribution</CardTitle>
                <CardDescription>Customer risk segmentation</CardDescription>
              </CardHeader>
              <CardContent>
                {churnRiskData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={churnRiskData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {churnRiskData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Adoption</CardTitle>
                <CardDescription>Feature usage across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessIntelligence?.feature_adoption_rates && 
                    Object.entries(businessIntelligence.feature_adoption_rates).map(([feature, rate]) => (
                      <div key={feature} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{feature.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{rate as number}%</span>
                        </div>
                        <Progress value={rate as number} className="h-2" />
                      </div>
                    ))
                  }
                  {!businessIntelligence?.feature_adoption_rates && (
                    <div className="text-center text-muted-foreground py-8">
                      No feature adoption data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns & Compliance Trends</CardTitle>
              <CardDescription>Historical patterns and state-level compliance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Seasonal Patterns</h4>
                  {businessIntelligence?.seasonal_patterns && 
                    Object.entries(businessIntelligence.seasonal_patterns).map(([period, value]) => (
                      <div key={period} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="text-sm text-muted-foreground capitalize">{period}</span>
                        <Badge variant="outline">{value as number}</Badge>
                      </div>
                    ))
                  }
                </div>
                <div>
                  <h4 className="font-medium mb-3">State Compliance Trends</h4>
                  {businessIntelligence?.state_compliance_trends && 
                    Object.entries(businessIntelligence.state_compliance_trends)
                      .slice(0, 5)
                      .map(([state, trend]) => (
                        <div key={state} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="text-sm text-muted-foreground">{state}</span>
                          <Badge variant="outline">{trend as number}%</Badge>
                        </div>
                      ))
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
