import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';

export interface AuditEvent {
  id: string;
  event_type: 'create' | 'update' | 'delete' | 'access' | 'auth' | 'system';
  resource_type: 'user' | 'entity' | 'payment' | 'document' | 'api_key' | 'system';
  resource_id?: string;
  user_id?: string;
  user_email?: string;
  action: string;
  description: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export interface ComplianceReport {
  id: string;
  report_type: 'data_access' | 'user_activity' | 'system_changes' | 'security_events';
  period_start: string;
  period_end: string;
  generated_by: string;
  generated_at: string;
  total_events: number;
  critical_events: number;
  compliance_score: number;
  findings: ComplianceFinding[];
  recommendations: string[];
}

export interface ComplianceFinding {
  id: string;
  category: 'access_control' | 'data_protection' | 'audit_trail' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_resources: string[];
  remediation_steps: string[];
  status: 'open' | 'in_progress' | 'resolved';
}

export const useAuditTrail = () => {
  const { isAdmin } = useAdminAccess();
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditData = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch real audit data from analytics_data table
      const { data: analyticsData } = await supabase
        .from('analytics_data')
        .select('*')
        .in('metric_type', ['security_audit', 'security_monitoring', 'user_action'])
        .order('created_at', { ascending: false })
        .limit(100);

      // Convert analytics data to audit events
      const realAuditEvents: AuditEvent[] = analyticsData?.map(data => ({
        id: data.id,
        event_type: 'system' as const,
        resource_type: 'system' as const,
        resource_id: data.entity_id || undefined,
        user_id: data.user_id,
        action: data.metric_name,
        description: `${data.metric_name} - ${data.metric_value}`,
        metadata: typeof data.metadata === 'object' && data.metadata !== null ? data.metadata as Record<string, any> : {},
        severity: 'medium' as const,
        timestamp: data.created_at,
      })) || [];

      // Mock additional audit events for demonstration
      const mockEvents: AuditEvent[] = [
        {
          id: 'audit_1',
          event_type: 'auth',
          resource_type: 'user',
          resource_id: 'user_123',
          user_id: 'user_123',
          user_email: 'john.doe@example.com',
          action: 'login_success',
          description: 'User successfully logged in',
          metadata: { method: 'password', location: 'New York, NY' },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'low',
          timestamp: '2024-01-08T14:30:00Z',
        },
        {
          id: 'audit_2',
          event_type: 'update',
          resource_type: 'entity',
          resource_id: 'entity_456',
          user_id: 'user_789',
          user_email: 'admin@example.com',
          action: 'entity_updated',
          description: 'Entity information updated by admin',
          metadata: { entity_name: 'Tech Corp LLC', admin_reason: 'Compliance update' },
          ip_address: '10.0.0.1',
          severity: 'medium',
          timestamp: '2024-01-08T13:15:00Z',
          changes: {
            before: { registered_agent_fee: 199, status: 'active' },
            after: { registered_agent_fee: 249, status: 'active' },
          },
        },
        {
          id: 'audit_3',
          event_type: 'access',
          resource_type: 'document',
          resource_id: 'doc_789',
          user_id: 'agent_456',
          user_email: 'agent@example.com',
          action: 'document_accessed',
          description: 'Sensitive document accessed by registered agent',
          metadata: { document_type: 'formation_documents', access_reason: 'client_request' },
          ip_address: '172.16.0.5',
          severity: 'high',
          timestamp: '2024-01-08T12:45:00Z',
        },
        {
          id: 'audit_4',
          event_type: 'system',
          resource_type: 'api_key',
          resource_id: 'key_123',
          user_id: 'admin_001',
          user_email: 'admin@example.com',
          action: 'api_key_created',
          description: 'New API key created with elevated permissions',
          metadata: { permissions: ['read:all', 'write:entities'], rate_limit: 5000 },
          ip_address: '10.0.0.1',
          severity: 'critical',
          timestamp: '2024-01-08T11:20:00Z',
        },
        {
          id: 'audit_5',
          event_type: 'delete',
          resource_type: 'user',
          resource_id: 'user_deleted',
          user_id: 'admin_001',
          user_email: 'admin@example.com',
          action: 'user_suspended',
          description: 'User account suspended for policy violation',
          metadata: { reason: 'Multiple failed payment attempts', auto_suspension: true },
          ip_address: '10.0.0.1',
          severity: 'high',
          timestamp: '2024-01-08T10:30:00Z',
        },
      ];

      // Mock compliance reports
      const mockReports: ComplianceReport[] = [
        {
          id: 'report_1',
          report_type: 'security_events',
          period_start: '2024-01-01T00:00:00Z',
          period_end: '2024-01-08T23:59:59Z',
          generated_by: 'admin_001',
          generated_at: '2024-01-08T15:00:00Z',
          total_events: 1247,
          critical_events: 3,
          compliance_score: 92.5,
          findings: [
            {
              id: 'finding_1',
              category: 'access_control',
              severity: 'medium',
              title: 'Elevated Access Usage',
              description: 'Admin privileges used 15% more than previous period',
              affected_resources: ['user_management', 'system_settings'],
              remediation_steps: ['Review admin access logs', 'Implement additional approval workflows'],
              status: 'open',
            },
            {
              id: 'finding_2',
              category: 'security',
              severity: 'high',
              title: 'Failed Login Attempts Spike',
              description: 'Failed login attempts increased by 40% from unusual IP ranges',
              affected_resources: ['authentication_system'],
              remediation_steps: ['Enable IP whitelisting', 'Implement CAPTCHA for repeated failures'],
              status: 'in_progress',
            },
          ],
          recommendations: [
            'Implement mandatory 2FA for all admin accounts',
            'Set up real-time alerts for critical system changes',
            'Regular access review for privileged accounts',
          ],
        },
        {
          id: 'report_2',
          report_type: 'data_access',
          period_start: '2024-01-01T00:00:00Z',
          period_end: '2024-01-07T23:59:59Z',
          generated_by: 'compliance_officer',
          generated_at: '2024-01-08T09:00:00Z',
          total_events: 892,
          critical_events: 1,
          compliance_score: 95.8,
          findings: [
            {
              id: 'finding_3',
              category: 'data_protection',
              severity: 'low',
              title: 'Document Access Pattern Anomaly',
              description: 'One user accessed 50+ documents in a single session',
              affected_resources: ['document_storage'],
              remediation_steps: ['Verify legitimate business need', 'Set access rate limits'],
              status: 'resolved',
            },
          ],
          recommendations: [
            'Implement document access rate limiting',
            'Enhanced monitoring for bulk data access',
          ],
        },
      ];

      setAuditEvents([...realAuditEvents, ...mockEvents]);
      setComplianceReports(mockReports);
    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError('Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  const logAuditEvent = async (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    try {
      // Log to analytics_data table for persistence
      await supabase.from('analytics_data').insert({
        user_id: event.user_id,
        metric_name: event.action,
        metric_value: 1,
        metric_type: 'security_audit',
        metric_date: new Date().toISOString().split('T')[0],
        metadata: {
          ...event.metadata,
          event_type: event.event_type,
          resource_type: event.resource_type,
          resource_id: event.resource_id,
          description: event.description,
          severity: event.severity,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
        },
      });

      // Update local state
      const newEvent: AuditEvent = {
        ...event,
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      setAuditEvents(prev => [newEvent, ...prev]);
    } catch (err) {
      console.error('Error logging audit event:', err);
      throw new Error('Failed to log audit event');
    }
  };

  const generateComplianceReport = async (
    reportType: ComplianceReport['report_type'],
    periodStart: string,
    periodEnd: string
  ) => {
    try {
      // In a real app, this would generate a comprehensive compliance report
      const newReport: ComplianceReport = {
        id: `report_${Date.now()}`,
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        generated_by: 'current_admin_id',
        generated_at: new Date().toISOString(),
        total_events: auditEvents.length,
        critical_events: auditEvents.filter(e => e.severity === 'critical').length,
        compliance_score: Math.random() * 15 + 85, // Mock score between 85-100
        findings: [],
        recommendations: [
          'Regular security training for all users',
          'Implement advanced threat detection',
          'Quarterly access reviews',
        ],
      };

      setComplianceReports(prev => [newReport, ...prev]);
      return newReport.id;
    } catch (err) {
      console.error('Error generating compliance report:', err);
      throw new Error('Failed to generate compliance report');
    }
  };

  const searchAuditEvents = (
    filters: {
      event_type?: string;
      resource_type?: string;
      user_id?: string;
      severity?: string;
      date_from?: string;
      date_to?: string;
    }
  ) => {
    return auditEvents.filter(event => {
      if (filters.event_type && event.event_type !== filters.event_type) return false;
      if (filters.resource_type && event.resource_type !== filters.resource_type) return false;
      if (filters.user_id && event.user_id !== filters.user_id) return false;
      if (filters.severity && event.severity !== filters.severity) return false;
      if (filters.date_from && event.timestamp < filters.date_from) return false;
      if (filters.date_to && event.timestamp > filters.date_to) return false;
      return true;
    });
  };

  useEffect(() => {
    fetchAuditData();
  }, [isAdmin]);

  return {
    auditEvents,
    complianceReports,
    loading,
    error,
    logAuditEvent,
    generateComplianceReport,
    searchAuditEvents,
    refetch: fetchAuditData,
  };
};