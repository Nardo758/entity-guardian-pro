import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, CreditCard, Receipt } from 'lucide-react';
import type { FinancialAnalytics } from '@/types/adminAnalytics';

interface RevenueChartProps {
  data: FinancialAnalytics;
  title?: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export const RevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  title = 'Financial Performance Dashboard' 
}) => {
  // Prepare tier revenue data for chart
  const tierData = Object.entries(data.revenue_by_tier).map(([tier, revenue], index) => ({
    tier: tier.charAt(0).toUpperCase() + tier.slice(1),
    revenue: Number(revenue),
    color: COLORS[index % COLORS.length]
  }));

  // Create monthly trend data (mock data for demonstration)
  const trendData = [
    { month: 'Jan', revenue: data.total_revenue * 0.7, mrr: data.mrr * 0.8 },
    { month: 'Feb', revenue: data.total_revenue * 0.75, mrr: data.mrr * 0.85 },
    { month: 'Mar', revenue: data.total_revenue * 0.85, mrr: data.mrr * 0.9 },
    { month: 'Apr', revenue: data.total_revenue * 0.9, mrr: data.mrr * 0.95 },
    { month: 'May', revenue: data.total_revenue * 0.95, mrr: data.mrr },
    { month: 'Jun', revenue: data.total_revenue, mrr: data.mrr }
  ];

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
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium capitalize">{data.tier}</p>
          <p className="text-sm text-muted-foreground">
            Revenue: {formatCurrency(data.revenue)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.mrr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current MRR
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.arpu)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average revenue per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.revenue_growth_rate > 0 ? '+' : ''}{data.revenue_growth_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              30-day revenue growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trends" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
              <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trends" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={3}
                      name="Total Revenue"
                      dot={{ fill: 'hsl(var(--chart-1))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mrr" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={3}
                      name="MRR"
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Revenue Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">30-Day Volume</span>
                    <Badge variant="secondary">{formatCurrency(data.payment_volume_30d)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Payment volume last 30 days</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Outstanding</span>
                    <Badge variant="destructive">{formatCurrency(data.outstanding_invoices)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Pending invoice payments</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">ARR</span>
                    <Badge variant="default">{formatCurrency(data.arr)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Annual recurring revenue</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="breakdown" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Revenue by Tier</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tierData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                      >
                        {tierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Tier Performance</h4>
                  {tierData.map((tier, index) => (
                    <div key={tier.tier} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tier.color }}
                        />
                        <div>
                          <p className="font-medium">{tier.tier}</p>
                          <p className="text-sm text-muted-foreground">
                            {((tier.revenue / data.total_revenue) * 100).toFixed(1)}% of revenue
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{formatCurrency(tier.revenue)}</Badge>
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