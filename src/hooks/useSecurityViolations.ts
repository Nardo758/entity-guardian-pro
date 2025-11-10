import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityViolation {
  id: string;
  user_id: string;
  metric_name: string;
  metric_value: number;
  metric_type: string;
  metric_date: string;
  metadata: any;
  created_at: string;
}

export const useSecurityViolations = (limit = 100) => {
  const { data: violations, isLoading, error } = useQuery({
    queryKey: ['security-violations', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .in('metric_type', ['security_violation', 'security_monitoring'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SecurityViolation[];
    },
  });

  return {
    violations,
    isLoading,
    error,
  };
};
