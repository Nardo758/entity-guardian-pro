import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, Database, Server, Wifi, AlertTriangle, 
  CheckCircle, TrendingUp, Clock, RefreshCw, 
  Monitor, HardDrive, Cpu, BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  status: 'normal' | 'warning' | 'critical';
  recorded_at: string;
}

const SystemHealthPanel = () => {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch system health metrics
      const { data: metricsData, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setMetrics((metricsData || []) as SystemMetric[]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockMetrics = async () => {
    // Generate some mock system health metrics for demonstration
    const mockMetrics = [
      { metric_name: 'cpu_usage', metric_value: 65.4, metric_unit: '%', status: 'normal' },
      { metric_name: 'memory_usage', metric_value: 78.2, metric_unit: '%', status: 'warning' },
      { metric_name: 'disk_usage', metric_value: 45.7, metric_unit: '%', status: 'normal' },
      { metric_name: 'database_connections', metric_value: 23, metric_unit: 'connections', status: 'normal' },
      { metric_name: 'response_time', metric_value: 145, metric_unit: 'ms', status: 'normal' },
      { metric_name: 'error_rate', metric_value: 0.02, metric_unit: '%', status: 'normal' },
      { metric_name: 'throughput', metric_value: 1250, metric_unit: 'requests/min', status: 'normal' },
      { metric_name: 'uptime', metric_value: 99.98, metric_unit: '%', status: 'normal' }
    ];

    for (const metric of mockMetrics) {
      await supabase
        .from('system_health_metrics')
        .insert({
          ...metric,
          status: metric.status as 'normal' | 'warning' | 'critical'
        });
    }
    
    await fetchSystemMetrics();
  };

  useEffect(() => {
    fetchSystemMetrics();
    
    // Set up periodic refresh
    const interval = setInterval(fetchSystemMetrics, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getLatestMetricValue = (metricName: string) => {
    const metric = metrics.find(m => m.metric_name === metricName);
    return metric || { metric_value: 0, status: 'normal', metric_unit: '' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const getProgressColor = (value: number, status: string) => {
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const cpuUsage = getLatestMetricValue('cpu_usage');
  const memoryUsage = getLatestMetricValue('memory_usage');
  const diskUsage = getLatestMetricValue('disk_usage');
  const dbConnections = getLatestMetricValue('database_connections');
  const responseTime = getLatestMetricValue('response_time');
  const errorRate = getLatestMetricValue('error_rate');
  const throughput = getLatestMetricValue('throughput');
  const uptime = getLatestMetricValue('uptime');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">System Health</h2>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <Button variant="outline" size="sm" onClick={fetchSystemMetrics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {metrics.length === 0 && (
            <Button variant="outline" size="sm" onClick={generateMockMetrics}>
              Generate Sample Data
            </Button>
          )}
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              {getStatusIcon(cpuUsage.status)}
            </div>
            <div className="space-y-2">
              <Progress 
                value={cpuUsage.metric_value} 
                className="h-2" 
              />
              <p className="text-2xl font-bold">{cpuUsage.metric_value.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              {getStatusIcon(memoryUsage.status)}
            </div>
            <div className="space-y-2">
              <Progress 
                value={memoryUsage.metric_value} 
                className="h-2" 
              />
              <p className="text-2xl font-bold">{memoryUsage.metric_value.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Disk Usage</span>
              </div>
              {getStatusIcon(diskUsage.status)}
            </div>
            <div className="space-y-2">
              <Progress 
                value={diskUsage.metric_value} 
                className="h-2" 
              />
              <p className="text-2xl font-bold">{diskUsage.metric_value.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Uptime</span>
              </div>
              {getStatusIcon(uptime.status)}
            </div>
            <div className="space-y-2">
              <Progress 
                value={uptime.metric_value} 
                className="h-2" 
              />
              <p className="text-2xl font-bold">{uptime.metric_value.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Response Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average</span>
                    <span className="font-semibold">{responseTime.metric_value}ms</span>
                  </div>
                  <Progress value={Math.min((responseTime.metric_value / 1000) * 100, 100)} className="h-2" />
                  <div className={`text-sm ${getStatusColor(responseTime.status)}`}>
                    {responseTime.status === 'normal' ? 'Excellent' : 
                     responseTime.status === 'warning' ? 'Acceptable' : 'Poor'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Throughput</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Requests/min</span>
                    <span className="font-semibold">{throughput.metric_value.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min((throughput.metric_value / 2000) * 100, 100)} className="h-2" />
                  <div className={`text-sm ${getStatusColor(throughput.status)}`}>
                    {throughput.status === 'normal' ? 'High Traffic' : 
                     throughput.status === 'warning' ? 'Moderate' : 'Low'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Active Connections</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current</span>
                    <span className="font-semibold">{dbConnections.metric_value}</span>
                  </div>
                  <Progress value={Math.min((dbConnections.metric_value / 100) * 100, 100)} className="h-2" />
                  <div className={`text-sm ${getStatusColor(dbConnections.status)}`}>
                    {dbConnections.status === 'normal' ? 'Normal Load' : 
                     dbConnections.status === 'warning' ? 'High Load' : 'Critical Load'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Database Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Query Performance</span>
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connection Pool</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Hit Ratio</span>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="w-5 h-5" />
                <span>Network Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">12ms</p>
                  <p className="text-sm text-muted-foreground">Latency</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">450MB</p>
                  <p className="text-sm text-muted-foreground">Bandwidth</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Packet Loss</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Error Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">{errorRate.metric_value.toFixed(3)}%</p>
                  <p className="text-sm text-muted-foreground">Current Error Rate</p>
                </div>
                <Progress value={errorRate.metric_value * 10} className="h-2" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">0</p>
                    <p className="text-sm text-muted-foreground">Critical Errors</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">3</p>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealthPanel;