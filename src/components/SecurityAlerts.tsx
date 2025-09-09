import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const SecurityAlerts: React.FC = () => {
  const { user } = useAuth();
  const { securityEvents, isMonitoring } = useSecurityMonitor();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchSecurityAlerts();
  }, [user]);

  const fetchSecurityAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('user_id', user?.id)
        .eq('metric_type', 'security_alert')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedAlerts: SecurityAlert[] = data.map(item => ({
        id: item.id,
        type: item.metric_name,
        severity: (item.metadata as any)?.severity || 'low',
        message: getAlertMessage(item.metric_name, item.metadata as any),
        timestamp: item.created_at,
        metadata: item.metadata as Record<string, any>
      }));

      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
      toast.error('Failed to load security alerts');
    } finally {
      setLoading(false);
    }
  };

  const getAlertMessage = (type: string, metadata: any) => {
    switch (type) {
      case 'unauthorized_access':
        return `Unauthorized access attempt to ${metadata?.resource || 'protected resource'}`;
      case 'suspicious_activity':
        return `Suspicious activity detected: ${metadata?.activity_type || 'unknown activity'}`;
      case 'admin_action':
        return `Admin action performed: ${metadata?.action || 'unknown action'}`;
      case 'failed_auth':
        return `Failed authentication attempt from ${metadata?.ip_address || 'unknown IP'}`;
      case 'data_access':
        return `Sensitive data accessed: ${metadata?.data_type || 'unknown data'}`;
      default:
        return `Security event: ${type}`;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Shield className="h-4 w-4 text-warning" />;
      case 'low':
        return <Activity className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('analytics_data')
        .update({ 
          metadata: { 
            ...alerts.find(a => a.id === alertId)?.metadata,
            dismissed: true,
            dismissed_at: new Date().toISOString()
          }
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Alert dismissed');
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Alerts
          {isMonitoring && (
            <Badge variant="outline" className="ml-auto">
              <Activity className="h-3 w-3 mr-1" />
              Monitoring Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No security alerts</p>
            <p className="text-sm text-muted-foreground">Your account is secure</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-4 border rounded-lg bg-card"
              >
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.metadata && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {alert.metadata.ip_address && (
                        <span>IP: {alert.metadata.ip_address} • </span>
                      )}
                      {alert.metadata.user_agent && (
                        <span>Browser: {alert.metadata.user_agent.substring(0, 50)}... • </span>
                      )}
                      {alert.metadata.timestamp && (
                        <span>Event: {new Date(alert.metadata.timestamp).toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Recent Events Summary */}
        {securityEvents.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Security Events</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Events:</span>
                <span className="ml-2 font-medium">{securityEvents.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">High Severity:</span>
                <span className="ml-2 font-medium">
                  {securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};