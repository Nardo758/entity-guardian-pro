import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, DollarSign, ArrowUpDown, Target, MapPin } from 'lucide-react';
import type { UserAnalytics } from '@/types/adminAnalytics';

interface AdvancedUserAnalyticsProps {
  data: UserAnalytics;
}

export const AdvancedUserAnalytics: React.FC<AdvancedUserAnalyticsProps> = ({ data }) => {
  // Prepare lifecycle metrics data
  const lifecycleData = [
    { metric: 'Trial to Paid', rate: data.trial_to_paid_conversion, target: 25, color: 'hsl(var(--chart-1))' },
    { metric: 'Upgrade Rate', rate: data.upgrade_rate, target: 15, color: 'hsl(var(--chart-2))' },
    { metric: 'Downgrade Rate', rate: data.downgrade_rate, target: 5, color: 'hsl(var(--chart-3))' }
  ];

  // Prepare CLV by segment data
  const clvData = Object.entries(data.clv_by_segment).map(([segment, value]) => ({
    segment: segment.charAt(0).toUpperCase() + segment.slice(1),
    clv: Number(value)
  }));

  // Prepare revenue concentration data
  const concentrationData = Object.entries(data.revenue_concentration).map(([region, percentage]) => ({
    region,
    percentage: Number(percentage)
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'CLV' ? formatCurrency(entry.value) : `${entry.value}%`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Advanced Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Conversion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.trial_to_paid_conversion.toFixed(1)}%
            </div>
            <Progress value={data.trial_to_paid_conversion} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Trial to paid conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upgrade Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.upgrade_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Users upgrading plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downgrade Rate</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.downgrade_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Users downgrading plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CLV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(Object.values(data.clv_by_segment).reduce((a, b) => a + b, 0) / Object.keys(data.clv_by_segment).length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customer lifetime value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced User & Account Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="lifecycle" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lifecycle">Lifecycle Metrics</TabsTrigger>
              <TabsTrigger value="clv">Customer Value</TabsTrigger>
              <TabsTrigger value="concentration">Revenue Distribution</TabsTrigger>
            </TabsList>

            <TabsContent value="lifecycle" className="space-y-4">
              <div className="space-y-6">
                {/* Lifecycle Conversion Rates */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Account Lifecycle Performance</h4>
                  {lifecycleData.map((item) => (
                    <div key={item.metric} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{item.rate.toFixed(1)}%</span>
                          <Badge variant={item.rate >= item.target ? "default" : "secondary"}>
                            Target: {item.target}%
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={(item.rate / item.target) * 100} 
                        className="h-3"
                      />
                    </div>
                  ))}
                </div>

                {/* Conversion Funnel Visualization */}
                <div className="h-64">
                  <h4 className="text-sm font-medium mb-4">Conversion Funnel</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lifecycleData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 30]} />
                      <YAxis type="category" dataKey="metric" width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="rate" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clv" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* CLV by Segment Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Customer Lifetime Value by Segment</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clvData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="clv" fill="hsl(var(--chart-1))" name="CLV" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* CLV Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Segment Performance</h4>
                  {clvData.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{segment.segment}</p>
                        <p className="text-sm text-muted-foreground">Customer segment</p>
                      </div>
                      <Badge variant="outline">{formatCurrency(segment.clv)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="concentration" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Revenue Concentration Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Revenue Concentration by Region</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={concentrationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="hsl(var(--chart-2))" 
                        fill="hsl(var(--chart-2))" 
                        fillOpacity={0.6}
                        name="Revenue %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Concentration Analysis */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Regional Distribution</h4>
                  {concentrationData.slice(0, 5).map((region) => (
                    <div key={region.region} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{region.region}</p>
                          <p className="text-sm text-muted-foreground">Regional market</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{region.percentage.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};