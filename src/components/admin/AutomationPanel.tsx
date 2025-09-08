import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Play, Pause, Settings, AlertTriangle, CheckCircle, 
  Clock, Shield, Users, CreditCard, FileText 
} from 'lucide-react';
import { useSystemAutomation } from '@/hooks/useSystemAutomation';
import { Skeleton } from '@/components/ui/skeleton';

const AutomationPanel = () => {
  const { 
    automationRules, 
    systemAlerts, 
    loading, 
    error,
    toggleAutomationRule,
    resolveAlert,
    executeRule 
  } = useSystemAutomation();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load automation data</p>
        </CardContent>
      </Card>
    );
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'user_inactive': return <Users className="w-4 h-4" />;
      case 'payment_failed': return <CreditCard className="w-4 h-4" />;
      case 'compliance_overdue': return <FileText className="w-4 h-4" />;
      case 'security_alert': return <Shield className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="w-5 h-5 text-red-600" />;
      case 'performance': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'compliance': return <FileText className="w-5 h-5 text-blue-600" />;
      case 'financial': return <CreditCard className="w-5 h-5 text-green-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">System Automation & Alerts</h2>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Active System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemAlerts.filter(alert => !alert.resolved).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
            {systemAlerts.filter(alert => !alert.resolved).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>No active alerts. System is running smoothly!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {automationRules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTriggerIcon(rule.trigger)}
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) => toggleAutomationRule(rule.id, checked)}
                  />
                  <Badge variant={rule.is_active ? "default" : "secondary"}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{rule.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trigger:</span>
                  <Badge variant="outline">{rule.trigger.replace('_', ' ')}</Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Action:</span>
                  <Badge variant="outline">{rule.action.replace('_', ' ')}</Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Executions:</span>
                  <span className="font-medium">{rule.execution_count}</span>
                </div>
                
                {rule.last_executed && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last run:</span>
                    <span className="text-xs">
                      {new Date(rule.last_executed).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => executeRule(rule.id)}
                  disabled={!rule.is_active}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Execute Now
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resolved Alerts History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Recently Resolved Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemAlerts.filter(alert => alert.resolved).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <h4 className="font-medium text-foreground">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Resolved on {alert.resolved_at && new Date(alert.resolved_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Resolved
                </Badge>
              </div>
            ))}
            {systemAlerts.filter(alert => alert.resolved).length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recently resolved alerts</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationPanel;