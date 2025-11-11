import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IPReputationRecord {
  id: string;
  ip_address: string;
  reputation_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  total_requests: number;
  failed_auth_attempts: number;
  rate_limit_violations: number;
  suspicious_patterns: number;
  last_violation_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  blocked_until: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useIPReputation = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ipReputations, isLoading, error } = useQuery({
    queryKey: ['ip-reputation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ip_reputation')
        .select('*')
        .order('reputation_score', { ascending: true });

      if (error) throw error;
      return data as IPReputationRecord[];
    },
  });

  const blockIP = useMutation({
    mutationFn: async ({ ipAddress, hours }: { ipAddress: string; hours: number }) => {
      const blockedUntil = new Date();
      blockedUntil.setHours(blockedUntil.getHours() + hours);

      const { error } = await supabase
        .from('ip_reputation')
        .update({ 
          blocked_until: blockedUntil.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-reputation'] });
      toast({
        title: 'IP Blocked',
        description: 'IP address has been blocked successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to block IP address.',
        variant: 'destructive',
      });
    },
  });

  const unblockIP = useMutation({
    mutationFn: async (ipAddress: string) => {
      const { error } = await supabase
        .from('ip_reputation')
        .update({ 
          blocked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-reputation'] });
      toast({
        title: 'IP Unblocked',
        description: 'IP address has been unblocked successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unblock IP address.',
        variant: 'destructive',
      });
    },
  });

  const resetReputation = useMutation({
    mutationFn: async (ipAddress: string) => {
      const { error } = await supabase
        .from('ip_reputation')
        .update({ 
          reputation_score: 100,
          risk_level: 'low',
          failed_auth_attempts: 0,
          rate_limit_violations: 0,
          suspicious_patterns: 0,
          blocked_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('ip_address', ipAddress);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-reputation'] });
      toast({
        title: 'Reputation Reset',
        description: 'IP reputation has been reset to default.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset IP reputation.',
        variant: 'destructive',
      });
    },
  });

  const deleteIP = useMutation({
    mutationFn: async (ipAddress: string) => {
      const { error } = await supabase
        .from('ip_reputation')
        .delete()
        .eq('ip_address', ipAddress);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ip-reputation'] });
      toast({
        title: 'IP Removed',
        description: 'IP address has been removed from tracking.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete IP address.',
        variant: 'destructive',
      });
    },
  });

  return {
    ipReputations,
    isLoading,
    error,
    blockIP,
    unblockIP,
    resetReputation,
    deleteIP,
  };
};
