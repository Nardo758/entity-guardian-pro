import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, Users, Clock, CreditCard } from 'lucide-react';
import type { FinancialAnalytics } from '@/types/adminAnalytics';

interface AdvancedFinancialAnalyticsProps {
  data: FinancialAnalytics;
}

export const AdvancedFinancialAnalytics: React.FC<AdvancedFinancialAnalyticsProps> = ({ data }) => {
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
    agent,
    commission: Number(commission)
  }));

  // Prepare accounts receivable aging data
  const receivableData = Object.entries(data.accounts_receivable_aging).map(([period, amount]) => ({
    period: period.replace('_', ' ').replace('plus', '+'),
    amount: Number(amount),
    percentage: (Number(amount) / Object.values(data.accounts_receivable_aging).reduce((a, b) => a + Number(b), 0) * 100)
  }));

  // Prepare revenue forecast data
  const forecastData = Object.entries(data.revenue_forecast).map(([quarter, projected]) => ({
    quarter: quarter.toUpperCase(),
    projected: Number(projected),
    current: data.total_revenue // Reference line
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

  return (
    <div className="space-y-6">
      {/* Advanced Financial Metrics */}
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
              From registered agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding AR</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(Object.values(data.accounts_receivable_aging).reduce((a, b) => a + Number(b), 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total receivables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Q1 Forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(Object.values(data.revenue_forecast)[0])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Next quarter projection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Agent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(Math.max(...Object.values(data.agent_commission_tracking).map(v => Number(v))))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Highest commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Financial Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Financial Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="commissions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="commissions">Agent Commissions</TabsTrigger>
              <TabsTrigger value="receivables">Accounts Receivable</TabsTrigger>
              <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
            </TabsList>

            <TabsContent value="commissions" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Agent Commission Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Agent Commission Performance</h4>
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
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Commission Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Top Performing Agents</h4>
                  {agentCommissionData.map((agent, index) => (
                    <div key={agent.agent} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Agent {agent.agent.split('_')[1]}</p>
                        <p className="text-sm text-muted-foreground">
                          {((agent.commission / agentCommissionData.reduce((sum, a) => sum + a.commission, 0)) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {formatCurrency(agent.commission)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="receivables" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Aging Analysis Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Accounts Receivable Aging</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={receivableData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="hsl(var(--chart-3))" 
                        fill="hsl(var(--chart-3))" 
                        fillOpacity={0.6}
                        name="Outstanding Amount"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Receivables Analysis */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Collection Analysis</h4>
                  {receivableData.map((item, index) => {
                    const riskLevel = index === 0 ? 'low' : index === 1 ? 'medium' : index === 2 ? 'high' : 'critical';
                    const badgeVariant = riskLevel === 'low' ? 'default' : 
                                       riskLevel === 'medium' ? 'secondary' : 
                                       riskLevel === 'high' ? 'outline' : 'destructive';
                    
                    return (
                      <div key={item.period} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.period}</span>
                          <Badge variant={badgeVariant}>{formatCurrency(item.amount)}</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Risk: {riskLevel}</span>
                            <span>{item.percentage.toFixed(1)}% of total</span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="forecast" className="space-y-4">
              <div className="space-y-6">
                {/* Revenue Forecast Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Quarterly Revenue Projections</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="projected" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={3}
                        name="Projected Revenue"
                        dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="current" 
                        stroke="hsl(var(--muted-foreground))" 
                        strokeDasharray="5 5"
                        name="Current Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Forecast Analysis */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {forecastData.map((forecast) => {
                    const growthFromCurrent = ((forecast.projected - forecast.current) / forecast.current * 100);
                    
                    return (
                      <Card key={forecast.quarter}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{forecast.quarter}</span>
                              <Badge variant={growthFromCurrent > 0 ? "default" : "secondary"}>
                                {growthFromCurrent > 0 ? '+' : ''}{growthFromCurrent.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="text-lg font-bold">
                              {formatCurrency(forecast.projected)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Projected revenue
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Forecast Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Revenue Forecast Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Annual Forecast</span>
                          <Badge variant="default">
                            {formatCurrency(Object.values(data.revenue_forecast).reduce((a, b) => a + Number(b), 0))}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Total projected for year</p>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Growth Target</span>
                          <Badge variant="secondary">25%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Annual growth objective</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};