import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity, Users, Lock, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { toast } from 'sonner';

interface SecurityEvent {
  id: string;
  user_id: string;
  metric_name: string;
  metric_value: number;
  metric_date: string;
  created_at: string;
  metadata: {
    timestamp?: string;
    user_agent?: string;
    ip_address?: string;
    action?: string;
    target_user_id?: string;
    error?: string;
    [key: string]: any;
  };
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  suspiciousLogins: number;
  adminActions: number;
  sessionTimeouts: number;
  recentEvents: SecurityEvent[];
}

const SecurityMonitoringPanel: React.FC = () => {
  const { hasAdminAccess } = useAdminAccess();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchSecurityMetrics = async () => {
    if (!hasAdminAccess) return;

    try {
      setLoading(true);

      // Fetch security events from analytics_data
      const { data: events, error } = await supabase
        .from('analytics_data')
        .select('*')
        .in('metric_type', ['security_event', 'security_audit', 'admin_operation', 'security_monitoring'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const recentEvents = events.filter(
        event => new Date(event.created_at) > last24Hours
      );

      const criticalEvents = events.filter(
        event => 
          event.metric_name.includes('unauthorized') ||
          event.metric_name.includes('suspicious') ||
          event.metric_name.includes('failure')
      );

      const suspiciousLogins = events.filter(
        event => 
          event.metric_name === 'login_failure' ||
          event.metric_name === 'suspicious_activity'
      );

      const adminActions = events.filter(
        event => event.metric_name.includes('admin') || event.metric_name.includes('operation')
      );

      const sessionTimeouts = events.filter(
        event => event.metric_name === 'session_timeout'
      );

      setMetrics({
        totalEvents: events.length,
        criticalEvents: criticalEvents.length,
        suspiciousLogins: suspiciousLogins.length,
        adminActions: adminActions.length,
        sessionTimeouts: sessionTimeouts.length,
        recentEvents: recentEvents.slice(0, 20) as SecurityEvent[]
      });

    } catch (error) {
      console.error('Error fetching security metrics:', error);
      toast.error('Failed to load security metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSecurityMetrics, 30000);
    return () => clearInterval(interval);
  }, [hasAdminAccess]);

  if (!hasAdminAccess) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Administrator privileges required to access security monitoring.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getEventSeverity = (event: SecurityEvent): 'high' | 'medium' | 'low' => {
    if (
      event.metric_name.includes('unauthorized') ||
      event.metric_name.includes('suspicious') ||
      event.metric_name.includes('failure')
    ) {
      return 'high';
    }
    if (
      event.metric_name.includes('admin') ||
      event.metric_name.includes('timeout')
    ) {
      return 'medium';
    }
    return 'low';
  };

  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;

    return <Badge variant={variants[severity]}>{severity.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitoring Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Events</p>
                    <p className="text-2xl font-bold">{metrics.totalEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Critical Events</p>
                    <p className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Failed Logins</p>
                    <p className="text-2xl font-bold text-orange-600">{metrics.suspiciousLogins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Admin Actions</p>
                    <p className="text-2xl font-bold">{metrics.adminActions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Session Timeouts</p>
                    <p className="text-2xl font-bold">{metrics.sessionTimeouts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Recent Events</TabsTrigger>
          <TabsTrigger value="critical">Critical Events</TabsTrigger>
          <TabsTrigger value="admin">Admin Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events (Last 24 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentEvents.length === 0 ? (
                  <p className="text-muted-foreground">No recent security events</p>
                ) : (
                  metrics.recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {event.metric_name}
                          </code>
                          {getSeverityBadge(getEventSeverity(event))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                        {event.metadata.action && (
                          <p className="text-sm">Action: {event.metadata.action}</p>
                        )}
                        {event.metadata.error && (
                          <p className="text-sm text-red-600">Error: {event.metadata.error}</p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        User: {event.user_id.slice(0, 8)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critical">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Critical Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentEvents
                  .filter(event => getEventSeverity(event) === 'high')
                  .map((event) => (
                    <Alert key={event.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <p><strong>{event.metric_name}</strong></p>
                          <p>Time: {new Date(event.created_at).toLocaleString()}</p>
                          <p>User: {event.user_id}</p>
                          {event.metadata.action && <p>Action: {event.metadata.action}</p>}
                          {event.metadata.error && <p>Error: {event.metadata.error}</p>}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Administrator Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentEvents
                  .filter(event => event.metric_name.includes('admin') || event.metric_name.includes('operation'))
                  .map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {event.metric_name}
                        </code>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>Admin: {event.user_id.slice(0, 8)}...</p>
                        {event.metadata.target_user_id && (
                          <p>Target: {event.metadata.target_user_id.slice(0, 8)}...</p>
                        )}
                        {event.metadata.operation && (
                          <p>Operation: {event.metadata.operation}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={fetchSecurityMetrics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default SecurityMonitoringPanel;