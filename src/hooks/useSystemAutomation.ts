import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'user_inactive' | 'payment_failed' | 'compliance_overdue' | 'security_alert';
  action: 'suspend_user' | 'send_reminder' | 'escalate_alert' | 'auto_process';
  conditions: Record<string, any>;
  is_active: boolean;
  last_executed?: string;
  execution_count: number;
}

export interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'compliance' | 'financial';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: Record<string, any>;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export const useSystemAutomation = () => {
  const { isAdmin } = useAdminAccess();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomationData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Mock automation rules - in a real app, these would come from the database
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Inactive User Suspension',
          description: 'Automatically suspend users inactive for 90+ days',
          trigger: 'user_inactive',
          action: 'suspend_user',
          conditions: { days_inactive: 90 },
          is_active: true,
          execution_count: 12,
          last_executed: '2024-01-07T10:30:00Z',
        },
        {
          id: '2',
          name: 'Payment Failure Reminder',
          description: 'Send reminders for failed payments after 24 hours',
          trigger: 'payment_failed',
          action: 'send_reminder',
          conditions: { hours_after_failure: 24 },
          is_active: true,
          execution_count: 45,
          last_executed: '2024-01-08T14:20:00Z',
        },
        {
          id: '3',
          name: 'Compliance Escalation',
          description: 'Escalate overdue compliance items to admin',
          trigger: 'compliance_overdue',
          action: 'escalate_alert',
          conditions: { days_overdue: 7 },
          is_active: true,
          execution_count: 8,
          last_executed: '2024-01-06T09:15:00Z',
        },
        {
          id: '4',
          name: 'Security Alert Response',
          description: 'Auto-block suspicious IP addresses',
          trigger: 'security_alert',
          action: 'auto_process',
          conditions: { failed_attempts: 5, time_window: 15 },
          is_active: false,
          execution_count: 0,
        },
      ];

      // Fetch real system alerts from analytics data
      const { data: analyticsAlerts } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('metric_type', 'security_monitoring')
        .order('created_at', { ascending: false })
        .limit(20);

      const systemAlertsData: SystemAlert[] = [
        {
          id: '1',
          type: 'security',
          severity: 'medium',
          title: 'Failed Login Attempts Spike',
          description: 'Unusual number of failed login attempts detected',
          metadata: { failed_attempts: 47, ip_addresses: ['192.168.1.100', '10.0.0.1'] },
          resolved: false,
          created_at: '2024-01-08T15:30:00Z',
        },
        {
          id: '2',
          type: 'performance',
          severity: 'high',
          title: 'Database Query Performance',
          description: 'Response times above threshold detected',
          metadata: { avg_response_time: 2.8, threshold: 2.0 },
          resolved: false,
          created_at: '2024-01-08T14:15:00Z',
        },
        {
          id: '3',
          type: 'compliance',
          severity: 'low',
          title: 'Renewal Deadlines Approaching',
          description: '45 entities have renewals due within 30 days',
          metadata: { entities_count: 45, states: ['Delaware', 'California'] },
          resolved: true,
          created_at: '2024-01-07T11:00:00Z',
          resolved_at: '2024-01-08T09:30:00Z',
        },
      ];

      setAutomationRules(mockRules);
      setSystemAlerts(systemAlertsData);
    } catch (err) {
      console.error('Error fetching automation data:', err);
      setError('Failed to fetch automation data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomationRule = async (ruleId: string, isActive: boolean) => {
    try {
      setAutomationRules(prev =>
        prev.map(rule =>
          rule.id === ruleId ? { ...rule, is_active: isActive } : rule
        )
      );
      
      // In a real app, this would update the database
      console.log(`Automation rule ${ruleId} ${isActive ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error toggling automation rule:', err);
      setError('Failed to update automation rule');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      setSystemAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId 
            ? { ...alert, resolved: true, resolved_at: new Date().toISOString() }
            : alert
        )
      );
      
      // In a real app, this would update the database
      console.log(`Alert ${alertId} resolved`);
    } catch (err) {
      console.error('Error resolving alert:', err);
      setError('Failed to resolve alert');
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      const rule = automationRules.find(r => r.id === ruleId);
      if (!rule) return;

      // Simulate rule execution
      setAutomationRules(prev =>
        prev.map(r =>
          r.id === ruleId
            ? {
                ...r,
                execution_count: r.execution_count + 1,
                last_executed: new Date().toISOString(),
              }
            : r
        )
      );

      console.log(`Executed automation rule: ${rule.name}`);
    } catch (err) {
      console.error('Error executing automation rule:', err);
      setError('Failed to execute automation rule');
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, [isAdmin]);

  return {
    automationRules,
    systemAlerts,
    loading,
    error,
    toggleAutomationRule,
    resolveAlert,
    executeRule,
    refetch: fetchAutomationData,
  };
};