import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileText, AlertTriangle, Activity, HelpCircle } from 'lucide-react';
import type { OperationalAnalytics } from '@/types/adminAnalytics';

interface OperationalMetricsChartProps {
  data: OperationalAnalytics;
  title?: string;
}

export const OperationalMetricsChart: React.FC<OperationalMetricsChartProps> = ({ 
  data, 
  title = 'Operational Efficiency Dashboard' 
}) => {
  // Create performance metrics data for visualization
  const performanceData = [
    {
      metric: 'Compliance Rate',
      value: data.compliance_completion_rate,
      target: 95,
      unit: '%'
    },
    {
      metric: 'System Uptime',
      value: data.system_uptime_percentage,
      target: 99,
      unit: '%'
    },
    {
      metric: 'Avg Processing Time',
      value: data.avg_processing_time_days,
      target: 3,
      unit: ' days',
      inverse: true // Lower is better
    }
  ];

  // Create weekly performance trend (mock data based on current metrics)
  const trendData = [
    { week: 'Week 1', compliance: data.compliance_completion_rate * 0.9, uptime: data.system_uptime_percentage * 0.98 },
    { week: 'Week 2', compliance: data.compliance_completion_rate * 0.92, uptime: data.system_uptime_percentage * 0.99 },
    { week: 'Week 3', compliance: data.compliance_completion_rate * 0.95, uptime: data.system_uptime_percentage * 0.995 },
    { week: 'Week 4', compliance: data.compliance_completion_rate, uptime: data.system_uptime_percentage }
  ];

  const getPerformanceColor = (value: number, target: number, inverse = false) => {
    const ratio = inverse ? target / value : value / target;
    if (ratio >= 1) return 'text-green-600';
    if (ratio >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value: number, target: number, inverse = false) => {
    const ratio = inverse ? target / value : value / target;
    if (ratio >= 1) return 'bg-green-600';
    if (ratio >= 0.8) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Operational Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.compliance_completion_rate.toFixed(1)}%
            </div>
            <Progress value={data.compliance_completion_rate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Compliance completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.avg_processing_time_days.toFixed(1)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average processing time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Volume</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.document_processing_volume.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Documents processed (30d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.system_uptime_percentage.toFixed(1)}%
            </div>
            <Progress value={data.system_uptime_percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Platform availability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Dashboard */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {performanceData.map((metric) => (
              <div key={metric.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.metric}</span>
                  <span className={`text-sm font-bold ${getPerformanceColor(metric.value, metric.target, metric.inverse)}`}>
                    {metric.value.toFixed(1)}{metric.unit}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current</span>
                    <span>Target: {metric.target}{metric.unit}</span>
                  </div>
                  <Progress 
                    value={metric.inverse ? 
                      Math.min(100, (metric.target / metric.value) * 100) : 
                      Math.min(100, (metric.value / metric.target) * 100)
                    } 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Issue Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Issue Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Failed Renewals</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                </div>
                <Badge variant={data.failed_renewals_30d > 10 ? "destructive" : "secondary"}>
                  {data.failed_renewals_30d}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Support Tickets</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                </div>
                <Badge variant="outline">
                  {data.support_ticket_volume}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Document Processing</p>
                    <p className="text-xs text-muted-foreground">Success rate</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {((data.document_processing_volume / (data.document_processing_volume + data.failed_renewals_30d)) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h5 className="text-sm font-medium mb-2">System Health Status</h5>
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Health</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Healthy</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{title} - Weekly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="week" 
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-muted-foreground"
                  tick={{ fontSize: 12 }}
                  domain={[80, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="compliance" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  name="Compliance Rate"
                  dot={{ fill: 'hsl(var(--chart-1))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  name="System Uptime"
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};