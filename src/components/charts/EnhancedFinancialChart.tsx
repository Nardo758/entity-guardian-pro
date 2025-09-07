import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Users, AlertCircle, Clock } from 'lucide-react';
import type { FinancialAnalytics } from '@/types/adminAnalytics';

interface EnhancedFinancialChartProps {
  data: FinancialAnalytics;
}

export const EnhancedFinancialChart: React.FC<EnhancedFinancialChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepare agent commission data
  const agentCommissionData = Object.entries(data.agent_commission_tracking).map(([agent, commission]) => ({
    agent: agent.replace('_', ' ').toUpperCase(),
    commission: Number(commission)
  }));

  // Prepare accounts receivable aging data
  const arAgingData = Object.entries(data.accounts_receivable_aging).map(([period, amount]) => ({
    period: period.replace('_', '-'),
    amount: Number(amount),
    risk: period.includes('90') ? 'high' : period.includes('60') ? 'medium' : 'low'
  }));

  // Prepare revenue forecast data
  const forecastData = Object.entries(data.revenue_forecast).map(([quarter, amount]) => ({
    quarter: quarter.toUpperCase().replace('_', ' '),
    forecast: Number(amount),
    current: quarter === 'q1_forecast' ? data.total_revenue * 0.25 : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Financial Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.agent_service_revenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total registered agent revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(Object.values(data.agent_commission_tracking).reduce((a, b) => a + b, 0) / Object.keys(data.agent_commission_tracking).length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average agent commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AR Total</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(Object.values(data.accounts_receivable_aging).reduce((a, b) => a + b, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total accounts receivable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Q1 Forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(Object.values(data.revenue_forecast)[0] || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next quarter projection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Financial Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Financial Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="commission" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="commission">Agent Commissions</TabsTrigger>
              <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
              <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
            </TabsList>

            <TabsContent value="commission" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Agent Commission Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Top Agent Performance</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agentCommissionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agent" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="commission" 
                        fill="hsl(var(--chart-1))" 
                        name="Commission"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Agent Performance Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Agent Commission Breakdown</h4>
                  {agentCommissionData.map((agent) => (
                    <div key={agent.agent} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{agent.agent}</p>
                        <p className="text-sm text-muted-foreground">Registered agent</p>
                      </div>
                      <Badge variant="outline">{formatCurrency(agent.commission)}</Badge>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Commission Insights</h5>
                    <p className="text-sm text-muted-foreground">
                      Total agent service revenue: {formatCurrency(data.agent_service_revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receivables" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* AR Aging Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Accounts Receivable Aging</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={arAgingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="amount" 
                        fill="hsl(var(--chart-3))" 
                        name="Outstanding"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* AR Risk Analysis */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Collection Risk Analysis</h4>
                  {arAgingData.map((item) => (
                    <div key={item.period} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.period} Days</p>
                          <p className="text-sm text-muted-foreground">Outstanding period</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskColor(item.risk)}>{item.risk} risk</Badge>
                        <span className="text-sm font-bold">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
                    <h5 className="text-sm font-medium mb-2 text-destructive">Collection Priority</h5>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(arAgingData.filter(item => item.risk === 'high').reduce((sum, item) => sum + item.amount, 0))} requires immediate attention
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="forecast" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Revenue Forecast Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Quarterly Revenue Forecast</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={3}
                        name="Forecast"
                        strokeDasharray="5 5"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="current" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={3}
                        name="Current"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecast Analysis */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Revenue Projections</h4>
                  {forecastData.map((quarter) => (
                    <div key={quarter.quarter} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{quarter.quarter}</p>
                        <p className="text-sm text-muted-foreground">Revenue projection</p>
                      </div>
                      <Badge variant="outline">{formatCurrency(quarter.forecast)}</Badge>
                    </div>
                  ))}

                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Growth Trajectory</h5>
                    <p className="text-sm text-muted-foreground">
                      Projected annual revenue: {formatCurrency(Object.values(data.revenue_forecast).reduce((a, b) => a + b, 0))}
                    </p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Current vs Q4 Target</span>
                        <span>{((data.total_revenue / Object.values(data.revenue_forecast)[3]) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={(data.total_revenue / Object.values(data.revenue_forecast)[3]) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};