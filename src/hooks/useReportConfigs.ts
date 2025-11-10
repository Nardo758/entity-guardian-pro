import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReportConfig {
  id: string;
  name: string;
  schedule_type: 'daily' | 'weekly' | 'manual';
  schedule_time: string;
  schedule_day: number | null;
  is_enabled: boolean;
  email_subject: string;
  email_template: string;
  custom_html: string | null;
  recipient_user_ids: string[];
  include_ip_reputation: boolean;
  include_violations: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useReportConfigs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['report-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_report_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReportConfig[];
    },
  });

  const createConfig = useMutation({
    mutationFn: async (config: Omit<ReportConfig, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('security_report_config')
        .insert({
          ...config,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-configs'] });
      toast({
        title: 'Report Created',
        description: 'Report configuration has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create report configuration.',
        variant: 'destructive',
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReportConfig> & { id: string }) => {
      const { error } = await supabase
        .from('security_report_config')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-configs'] });
      toast({
        title: 'Report Updated',
        description: 'Report configuration has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update report configuration.',
        variant: 'destructive',
      });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('security_report_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-configs'] });
      toast({
        title: 'Report Deleted',
        description: 'Report configuration has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete report configuration.',
        variant: 'destructive',
      });
    },
  });

  const runReport = useMutation({
    mutationFn: async (configId: string) => {
      const config = configs?.find(c => c.id === configId);
      if (!config) throw new Error('Configuration not found');

      const { error } = await supabase.functions.invoke('send-security-report', {
        body: {
          configId,
          reportType: config.schedule_type === 'manual' ? 'daily' : config.schedule_type,
          manualTrigger: true,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Report Sent',
        description: 'Security report has been sent successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send report.',
        variant: 'destructive',
      });
    },
  });

  return {
    configs,
    isLoading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    runReport,
  };
};
