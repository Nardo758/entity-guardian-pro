import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureGate } from '@/components/FeatureGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEntities } from '@/hooks/useEntities';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePayments } from '@/hooks/usePayments';
import { ComplianceChart } from '@/components/charts/ComplianceChart';
import { CostAnalysisChart } from '@/components/charts/CostAnalysisChart';
import { MetricsChart } from '@/components/charts/MetricsChart';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

const Analytics: React.FC = () => {
  const { entities, loading: entitiesLoading } = useEntities();
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const { 
    analyticsData, 
    complianceChecks, 
    costProjections, 
    loading: analyticsLoading 
  } = useAnalytics(selectedEntityId);
  const { payments } = usePayments();

  // Calculate key metrics
  const totalEntities = entities.length;
  const completedCompliance = complianceChecks.filter(c => c.status === 'completed').length;
  const overdueCompliance = complianceChecks.filter(c => c.status === 'overdue').length;
  const totalProjectedCosts = costProjections.reduce((sum, p) => sum + Number(p.projected_amount), 0);
  const totalActualCosts = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const handleExportReport = () => {
    // This would implement export functionality
    console.log('Exporting analytics report...');
  };

  if (analyticsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  return (
    <FeatureGate feature="canAdvancedAnalytics" requiredTier="professional">
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced insights and reporting for your business entities
          </p>
        </div>
        <Button onClick={handleExportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Entity Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Entity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedEntityId || 'all'} 
            onValueChange={(value) => setSelectedEntityId(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an entity or view all data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {!entitiesLoading && entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name} ({entity.type.replace('_', ' ').toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntities}</div>
            <p className="text-xs text-muted-foreground">
              Active business entities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceChecks.length > 0 
                ? Math.round((completedCompliance / complianceChecks.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCompliance} of {complianceChecks.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCompliance}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Variance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.abs(totalProjectedCosts - totalActualCosts).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalActualCosts > totalProjectedCosts ? 'Over' : 'Under'} budget
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <MetricsChart 
            analyticsData={analyticsData}
            title={selectedEntityId 
              ? `Metrics for ${entities.find(e => e.id === selectedEntityId)?.name}`
              : 'Business Metrics Overview'
            }
          />
          
          {/* Recent Analytics Data */}
          {analyticsData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Analytics Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.slice(0, 5).map((data) => (
                    <div key={data.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{data.metric_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.metric_type} • {new Date(data.metric_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{data.metric_value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceChart 
            complianceChecks={complianceChecks}
            title={selectedEntityId 
              ? `Compliance for ${entities.find(e => e.id === selectedEntityId)?.name}`
              : 'Overall Compliance Status'
            }
          />
          
          {/* Upcoming Compliance Items */}
          {complianceChecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Compliance Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceChecks
                    .filter(check => check.status === 'pending' || check.status === 'overdue')
                    .slice(0, 5)
                    .map((check) => (
                      <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{check.check_name}</p>
                          <p className="text-sm text-muted-foreground">{check.check_type}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {check.due_date && (
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(check.due_date).toLocaleDateString()}
                            </p>
                          )}
                          <Badge variant={check.status === 'overdue' ? 'destructive' : 'secondary'}>
                            {check.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <CostAnalysisChart 
            costProjections={costProjections}
            payments={payments}
            title={selectedEntityId 
              ? `Cost Analysis for ${entities.find(e => e.id === selectedEntityId)?.name}`
              : 'Overall Cost Analysis'
            }
          />
          
          {/* Cost Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Projected vs Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Projected:</span>
                    <span className="font-bold">${totalProjectedCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Actual:</span>
                    <span className="font-bold">${totalActualCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Variance:</span>
                    <span className={`font-bold ${
                      totalActualCosts > totalProjectedCosts ? 'text-destructive' : 'text-green-600'
                    }`}>
                      {totalActualCosts > totalProjectedCosts ? '+' : '-'}
                      ${Math.abs(totalProjectedCosts - totalActualCosts).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costProjections
                    .reduce((acc, proj) => {
                      const type = proj.projection_type;
                      acc[type] = (acc[type] || 0) + Number(proj.projected_amount);
                      return acc;
                    }, {} as Record<string, number>)
                    && Object.entries(
                      costProjections.reduce((acc, proj) => {
                        const type = proj.projection_type;
                        acc[type] = (acc[type] || 0) + Number(proj.projected_amount);
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, amount]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type.replace('_', ' ')}:</span>
                        <span className="font-bold">${amount.toLocaleString()}</span>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </FeatureGate>
  );
};

export default Analytics;