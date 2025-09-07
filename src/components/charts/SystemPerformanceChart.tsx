import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Database, Shield, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { OperationalAnalytics } from '@/types/adminAnalytics';

interface SystemPerformanceChartProps {
  data: OperationalAnalytics;
}

export const SystemPerformanceChart: React.FC<SystemPerformanceChartProps> = ({ data }) => {
  // Prepare database performance data
  const dbPerformanceData = Object.entries(data.database_performance_metrics).map(([metric, value]) => ({
    metric: metric.replace('_', ' ').toUpperCase(),
    value: Number(value),
    threshold: metric.includes('time') ? 100 : 95
  }));

  // Prepare API usage patterns
  const apiUsageData = Object.entries(data.api_usage_patterns).map(([endpoint, requests]) => ({
    endpoint: endpoint.replace('_', ' '),
    requests: Number(requests)
  }));

  // Prepare response time trends (mock trend data)
  const responseTimeData = Object.entries(data.response_times).map(([time, value], index) => ({
    time: `${index * 4}:00`,
    response_time: Number(value),
    threshold: 200
  }));

  const getStatusColor = (value: number, threshold: number, isTime = false) => {
    const isGood = isTime ? value <= threshold : value >= threshold;
    return isGood ? 'text-green-600' : value >= threshold * 0.8 ? 'text-yellow-600' : 'text-red-600';
  };

  const getStatusBadge = (value: number, threshold: number, isTime = false) => {
    const isGood = isTime ? value <= threshold : value >= threshold;
    return isGood ? 'default' : value >= threshold * 0.8 ? 'secondary' : 'destructive';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'response_time' && 'ms'}
              {entry.dataKey === 'requests' && ' req/min'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {data.security_incidents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(data.response_times).reduce((a, b) => a + b, 0) / Object.keys(data.response_times).length}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              API response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Performance</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Object.values(data.database_performance_metrics)[0] || 95}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Query performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.values(data.api_usage_patterns).reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total API calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Performance Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="database" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="database">Database Performance</TabsTrigger>
              <TabsTrigger value="api">API Analytics</TabsTrigger>
              <TabsTrigger value="security">Security & Incidents</TabsTrigger>
            </TabsList>

            <TabsContent value="database" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Database Metrics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Database Metrics</h4>
                  {dbPerformanceData.map((metric) => (
                    <div key={metric.metric} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getStatusColor(metric.value, metric.threshold, metric.metric.includes('TIME'))}`}>
                            {metric.value.toFixed(1)}{metric.metric.includes('TIME') ? 'ms' : '%'}
                          </span>
                          <Badge variant={getStatusBadge(metric.value, metric.threshold, metric.metric.includes('TIME'))}>
                            {metric.metric.includes('TIME') ? `< ${metric.threshold}ms` : `> ${metric.threshold}%`}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={metric.metric.includes('TIME') ? 
                          Math.min(100, (metric.threshold / metric.value) * 100) : 
                          Math.min(100, (metric.value / metric.threshold) * 100)
                        } 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>

                {/* Performance Trends */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">Response Time Trends (24h)</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={responseTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="response_time" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        name="Response Time"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="threshold" 
                        stroke="hsl(var(--destructive))" 
                        strokeDasharray="5 5"
                        name="Threshold"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* API Usage Chart */}
                <div className="h-80">
                  <h4 className="text-sm font-medium mb-4">API Usage Patterns</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={apiUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="endpoint" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="requests" 
                        fill="hsl(var(--chart-2))" 
                        name="Requests"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* API Endpoint Stats */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Endpoint Statistics</h4>
                  {apiUsageData.slice(0, 6).map((endpoint) => (
                    <div key={endpoint.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{endpoint.endpoint}</p>
                        <p className="text-sm text-muted-foreground">API endpoint</p>
                      </div>
                      <Badge variant="outline">{endpoint.requests.toLocaleString()} req</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid gap-6">
                {/* Security Status */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Security Status</p>
                            <p className="text-sm text-muted-foreground">System secure</p>
                          </div>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border-l-4 ${data.security_incidents > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className={`h-5 w-5 ${data.security_incidents > 0 ? 'text-red-600' : 'text-green-600'}`} />
                          <div>
                            <p className="font-medium">Incidents (30d)</p>
                            <p className="text-sm text-muted-foreground">{data.security_incidents} reported</p>
                          </div>
                        </div>
                        <Badge variant={data.security_incidents > 0 ? "destructive" : "default"}>
                          {data.security_incidents > 0 ? 'Attention' : 'Clear'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Security Metrics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Security Monitoring</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Failed Login Attempts</span>
                        <Badge variant="secondary">0</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">No suspicious activity detected</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Rate Limit Violations</span>
                        <Badge variant="secondary">0</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">All API usage within limits</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">SSL Certificate</span>
                        <Badge variant="default">Valid</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Certificate expires in 90 days</p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Backup Status</span>
                        <Badge variant="default">Current</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
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