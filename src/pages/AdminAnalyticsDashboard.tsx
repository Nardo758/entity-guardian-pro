import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { UserGrowthChart } from '@/components/charts/UserGrowthChart';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { EntityDistributionChart } from '@/components/charts/EntityDistributionChart';
import { OperationalMetricsChart } from '@/components/charts/OperationalMetricsChart';
import { AdvancedUserAnalytics } from '@/components/charts/AdvancedUserAnalytics';
import { SystemPerformanceChart } from '@/components/charts/SystemPerformanceChart';
import { EnhancedFinancialChart } from '@/components/charts/EnhancedFinancialChart';
import { AdvancedFinancialAnalytics } from '@/components/charts/AdvancedFinancialAnalytics';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Building2, 
  Activity,
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Star,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';

const AdminAnalyticsDashboard: React.FC = () => {
  const { hasAdminAccess } = useAdminAccess();
  const { metrics, loading, error, refetch, exportReport } = useAdminAnalytics();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!hasAdminAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                You need administrator privileges to access the analytics dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Analytics</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { 
    userAnalytics, 
    financialAnalytics, 
    entityAnalytics, 
    operationalAnalytics, 
    businessIntelligence 
  } = metrics;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and KPI monitoring for Entity Renewal Pro
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated: {format(new Date(), 'PPpp')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      {userAnalytics && financialAnalytics && entityAnalytics && operationalAnalytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userAnalytics.total_users.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                <Badge variant="secondary" className="text-xs">
                  +{userAnalytics.user_growth_30d} this month
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${financialAnalytics.total_revenue.toLocaleString()}
              </div>
              <div className="flex items-center mt-1">
                <Badge variant={financialAnalytics.revenue_growth_rate > 0 ? "default" : "secondary"} className="text-xs">
                  {financialAnalytics.revenue_growth_rate > 0 ? '+' : ''}{financialAnalytics.revenue_growth_rate.toFixed(1)}% growth
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Entities</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entityAnalytics.total_entities.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                <Badge variant="secondary" className="text-xs">
                  +{entityAnalytics.entity_creation_rate_30d} new
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {operationalAnalytics.system_uptime_percentage.toFixed(1)}%
              </div>
              <div className="flex items-center mt-1">
                <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Sections */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="entities" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Entities
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {userAnalytics ? (
            <div className="space-y-6">
              <UserGrowthChart 
                data={userAnalytics} 
                title="User & Account Analytics"
              />
              <AdvancedUserAnalytics data={userAnalytics} />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No user analytics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {financialAnalytics ? (
            <div className="space-y-6">
              <RevenueChart 
                data={financialAnalytics} 
                title="Financial Performance Dashboard"
              />
              <AdvancedFinancialAnalytics data={financialAnalytics} />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No financial analytics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="entities" className="space-y-6">
          {entityAnalytics ? (
            <EntityDistributionChart 
              data={entityAnalytics} 
              title="Entity Management Analytics"
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No entity analytics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {operationalAnalytics ? (
            <div className="space-y-6">
              <OperationalMetricsChart 
                data={operationalAnalytics} 
                title="Operational Efficiency Dashboard"
              />
              <SystemPerformanceChart data={operationalAnalytics} />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No operational analytics data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          {businessIntelligence ? (
            <div className="space-y-6">
              {/* Business Intelligence Overview */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Customer Satisfaction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {businessIntelligence.customer_satisfaction_score.toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground">out of 5.0</p>
                      <div className="flex justify-center mt-4">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={`h-6 w-6 ${
                              i < Math.floor(businessIntelligence.customer_satisfaction_score) 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-muted'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Churn Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Low Risk</span>
                        <Badge variant="default">{businessIntelligence.churn_risk_indicators.low_risk}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Medium Risk</span>
                        <Badge variant="secondary">{businessIntelligence.churn_risk_indicators.medium_risk}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">High Risk</span>
                        <Badge variant="destructive">{businessIntelligence.churn_risk_indicators.high_risk}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Seasonal Patterns & State Compliance */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Entity Registration Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(businessIntelligence.seasonal_patterns).map(([month, count]) => (
                        <div key={month} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{month.trim()}</span>
                          <Badge variant="outline">{count} entities</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>State Compliance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(businessIntelligence.state_compliance_trends)
                        .sort(([,a], [,b]) => Number(b) - Number(a))
                        .slice(0, 8)
                        .map(([state, rate]) => (
                          <div key={state} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{state}</span>
                            <Badge variant={Number(rate) > 90 ? "default" : Number(rate) > 70 ? "secondary" : "destructive"}>
                              {Number(rate).toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feature Adoption */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature Adoption Rates (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(businessIntelligence.feature_adoption_rates).map(([feature, usage]) => (
                      <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium capitalize">{feature.replace('_', ' ')}</span>
                        <Badge variant="secondary">{usage} uses</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No business intelligence data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsDashboard;