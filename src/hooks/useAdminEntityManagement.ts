import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ManagedEntity {
  id: string;
  name: string;
  type: string;
  state: string;
  status: string | null;
  user_id: string;
  formation_date: string | null;
  registered_agent_fee: number | null;
  independent_director_fee: number | null;
  created_at: string;
  updated_at: string;
  owner_name: string;
  owner_email: string;
}

export const useAdminEntityManagement = () => {
  const queryClient = useQueryClient();

  const { data: entities, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-managed-entities'],
    queryFn: async () => {
      // Get all entities
      const { data: entitiesData, error: entitiesError } = await supabase
        .from('entities')
        .select('*')
        .order('created_at', { ascending: false });

      if (entitiesError) throw entitiesError;

      // Get owner profiles
      const userIds = [...new Set((entitiesData || []).map(e => e.user_id))];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, company')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get subscriber emails
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('user_id, email')
        .in('user_id', userIds);

      if (subscribersError) throw subscribersError;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const subscriberMap = new Map((subscribers || []).map(s => [s.user_id, s]));

      const managedEntities: ManagedEntity[] = (entitiesData || []).map(entity => {
        const profile = profileMap.get(entity.user_id);
        const subscriber = subscriberMap.get(entity.user_id);
        const ownerName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.company || 'Unknown'
          : 'Unknown';

        return {
          ...entity,
          owner_name: ownerName,
          owner_email: subscriber?.email || 'N/A',
        };
      });

      return managedEntities;
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: async ({
      entityId,
      updates,
    }: {
      entityId: string;
      updates: Partial<{
        name: string;
        type: string;
        state: string;
        status: string;
        formation_date: string;
        registered_agent_fee: number;
        independent_director_fee: number;
      }>;
    }) => {
      const { error } = await supabase
        .from('entities')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-entities'] });
      toast.success('Entity updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update entity: ${error.message}`);
    },
  });

  const deleteEntityMutation = useMutation({
    mutationFn: async (entityId: string) => {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-entities'] });
      toast.success('Entity deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete entity: ${error.message}`);
    },
  });

  const stats = {
    total: entities?.length || 0,
    active: entities?.filter(e => e.status === 'active').length || 0,
    inactive: entities?.filter(e => e.status !== 'active').length || 0,
    byState: entities?.reduce((acc, e) => {
      acc[e.state] = (acc[e.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    byType: entities?.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
  };

  return {
    entities: entities || [],
    isLoading,
    error,
    refetch,
    stats,
    updateEntity: updateEntityMutation.mutate,
    deleteEntity: deleteEntityMutation.mutate,
    isUpdating: updateEntityMutation.isPending,
    isDeleting: deleteEntityMutation.isPending,
  };
};
