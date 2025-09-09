import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  type: 'unauthorized_access' | 'suspicious_activity' | 'admin_action' | 'failed_auth' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface SecurityMonitorConfig {
  enableRealTimeAlerts: boolean;
  maxFailedAttempts: number;
  sessionTimeoutMinutes: number;
  suspiciousActivityThreshold: number;
}

export const useSecurityMonitor = () => {
  const { user, profile } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const config: SecurityMonitorConfig = {
    enableRealTimeAlerts: true,
    maxFailedAttempts: 5,
    sessionTimeoutMinutes: 30,
    suspiciousActivityThreshold: 10
  };

  // Log security event to database
  const logSecurityEvent = async (event: SecurityEvent) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('analytics_data').insert({
        user_id: user.id,
        metric_type: 'security_event',
        metric_name: event.type,
        metric_value: 1,
        metric_date: new Date().toISOString().split('T')[0],
        metadata: {
          severity: event.severity,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: await getUserIP(),
          ...event.metadata
        }
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Add to local state for immediate UI feedback
      setSecurityEvents(prev => [...prev.slice(-9), event]);

    } catch (error) {
      console.error('Security monitoring error:', error);
    }
  };

  // Get user IP address
  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  // Monitor admin access patterns
  const monitorAdminAccess = async (action: string, targetUserId?: string) => {
    if (!profile?.roles?.includes('admin')) return;

    await logSecurityEvent({
      type: 'admin_action',
      severity: 'medium',
      metadata: {
        action,
        target_user_id: targetUserId,
        admin_user_id: user?.id,
        timestamp: new Date().toISOString()
      }
    });
  };

  // Monitor unauthorized access attempts
  const monitorUnauthorizedAccess = async (resource: string, requiredPermission: string) => {
    await logSecurityEvent({
      type: 'unauthorized_access',
      severity: 'high',
      metadata: {
        resource,
        required_permission: requiredPermission,
        user_roles: profile?.roles || [],
        attempted_at: new Date().toISOString()
      }
    });
  };

  // Monitor suspicious activity patterns
  const monitorSuspiciousActivity = async (activityType: string, count: number) => {
    if (count >= config.suspiciousActivityThreshold) {
      await logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        metadata: {
          activity_type: activityType,
          activity_count: count,
          threshold_exceeded: true,
          time_window: '5 minutes'
        }
      });
    }
  };

  // Monitor failed authentication attempts
  const monitorFailedAuth = async (email: string, reason: string) => {
    await logSecurityEvent({
      type: 'failed_auth',
      severity: 'medium',
      metadata: {
        attempted_email: email,
        failure_reason: reason,
        consecutive_failures: true
      }
    });
  };

  // Monitor sensitive data access
  const monitorDataAccess = async (dataType: string, recordId?: string) => {
    await logSecurityEvent({
      type: 'data_access',
      severity: 'low',
      metadata: {
        data_type: dataType,
        record_id: recordId,
        access_method: 'api',
        user_type: profile?.user_type || 'unknown'
      }
    });
  };

  // Start monitoring user activity
  useEffect(() => {
    if (!user) return;

    setIsMonitoring(true);

    // Monitor page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'low',
          metadata: {
            activity: 'tab_hidden',
            duration: Date.now()
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setIsMonitoring(false);
    };
  }, [user]);

  return {
    securityEvents,
    isMonitoring,
    logSecurityEvent,
    monitorAdminAccess,
    monitorUnauthorizedAccess,
    monitorSuspiciousActivity,
    monitorFailedAuth,
    monitorDataAccess,
    config
  };
};