import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  action_category: string;
  target_user_id?: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  metadata: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  admin_email?: string;
  target_email?: string;
}

export interface AuditLogStats {
  total_actions: number;
  actions_by_category: Record<string, number>;
  actions_by_severity: Record<string, number>;
  top_admins: Record<string, number>;
  recent_critical_events: number;
}

export const useAdminAuditLog = (filters?: {
  category?: string;
  severity?: string;
  searchTerm?: string;
  days?: number;
  limit?: number;
}) => {
  const { isAdmin } = useAdminAccess();
  const queryClient = useQueryClient();

  // Fetch audit log entries
  const { data: entries, isLoading: entriesLoading, refetch: refetchEntries } = useQuery({
    queryKey: ['admin-audit-log', filters],
    queryFn: async () => {
      if (!isAdmin) return [];

      let query = supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin:admin_user_id(email),
          target:target_user_id(email)
        `)
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('action_category', filters.category);
      }

      if (filters?.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - filters.days);
        query = query.gte('created_at', startDate.toISOString());
      }

      query = query.limit(filters?.limit || 100);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((entry: any) => ({
        ...entry,
        admin_email: entry.admin?.[0]?.email || 'Unknown',
        target_email: entry.target?.[0]?.email || null,
      })) as AuditLogEntry[];
    },
    enabled: isAdmin,
  });

  // Fetch audit log statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-audit-stats', filters?.days || 30],
    queryFn: async () => {
      if (!isAdmin) return null;

      const { data, error } = await supabase
        .rpc('get_audit_log_stats', { p_days: filters?.days || 30 });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const result = data[0];
      return {
        total_actions: Number(result.total_actions || 0),
        actions_by_category: result.actions_by_category || {},
        actions_by_severity: result.actions_by_severity || {},
        top_admins: result.top_admins || {},
        recent_critical_events: Number(result.recent_critical_events || 0),
      } as AuditLogStats;
    },
    enabled: isAdmin,
  });

  // Filter entries by search term on the client side
  const filteredEntries = entries?.filter(entry => {
    if (!filters?.searchTerm) return true;
    const search = filters.searchTerm.toLowerCase();
    return (
      entry.description.toLowerCase().includes(search) ||
      entry.action_type.toLowerCase().includes(search) ||
      entry.admin_email?.toLowerCase().includes(search) ||
      entry.target_email?.toLowerCase().includes(search)
    );
  });

  const refetch = () => {
    refetchEntries();
    refetchStats();
  };

  return {
    entries: filteredEntries || [],
    stats,
    isLoading: entriesLoading || statsLoading,
    refetch,
  };
};
