import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminAccess } from '@/hooks/useAdminAccess';

interface SecurityEvent {
  id: string;
  user_id: string;
  metric_name: string;
  metric_value: number;
  metric_date: string;
  created_at: string;
  metadata: any;
}

export const SecurityAuditDashboard: React.FC = () => {
  const { hasAdminAccess } = useAdminAccess();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'security_audit' | 'security_monitoring'>('all');

  const fetchSecurityEvents = async () => {
    try {
      let query = supabase
        .from('analytics_data')
        .select('*')
        .in('metric_type', ['security_audit', 'security_monitoring'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('metric_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching security events:', error);
        toast.error('Failed to load security events');
        return;
      }

      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAdminAccess) {
      fetchSecurityEvents();
    }
  }, [hasAdminAccess, filter]);

  const exportSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .in('metric_type', ['security_audit', 'security_monitoring'])
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to export security events');
        return;
      }

      const csvContent = [
        'Date,Event Type,User ID,Details',
        ...data.map(event => 
          `${event.created_at},${event.metric_name},${event.user_id},"${JSON.stringify(event.metadata).replace(/"/g, '""')}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Security events exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export security events');
    }
  };

  const getEventSeverity = (eventName: string) => {
    const criticalEvents = ['role_assignment_unauthorized_attempt', 'self_role_modification_attempt', 'role_removal_unauthorized_attempt'];
    const warningEvents = ['user_not_found', 'role_assignment_failed', 'role_removal_failed'];
    
    if (criticalEvents.includes(eventName)) return 'critical';
    if (warningEvents.includes(eventName)) return 'warning';
    return 'info';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <Eye className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <AlertTriangle className="h-12 w-12 text-warning" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You need admin privileges to view security audit logs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Audit Dashboard</h2>
          <p className="text-muted-foreground">Monitor and review security events</p>
        </div>
        <Button onClick={exportSecurityEvents} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Events
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Events
        </Button>
        <Button
          variant={filter === 'security_audit' ? 'default' : 'outline'}
          onClick={() => setFilter('security_audit')}
          size="sm"
        >
          Audit Events
        </Button>
        <Button
          variant={filter === 'security_monitoring' ? 'default' : 'outline'}
          onClick={() => setFilter('security_monitoring')}
          size="sm"
        >
          Monitoring Events
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : securityEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No security events found
            </div>
          ) : (
            <div className="space-y-4">
              {securityEvents.map((event) => {
                const severity = getEventSeverity(event.metric_name);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(severity)}
                      <Badge variant={getSeverityColor(severity) as any}>
                        {severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {event.metric_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </h4>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        User ID: {event.user_id}
                      </div>
                      
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-primary hover:underline">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};