import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ManagedUser {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  user_type: string | null;
  plan: string | null;
  account_status: string | null;
  created_at: string;
  roles: string[];
  subscription_tier: string | null;
  subscribed: boolean;
}

export const useAdminUserManagement = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-managed-users'],
    queryFn: async () => {
      // Get admin session token from sessionStorage
      const sessionToken = sessionStorage.getItem('admin_session_token');
      
      if (!sessionToken) {
        console.error('useAdminUserManagement: No admin session token found');
        throw new Error('No admin session token');
      }

      console.log('useAdminUserManagement: Fetching users...');
      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: { type: 'all_users' },
      });

      console.log('useAdminUserManagement: Response:', { data, error });

      if (error) {
        console.error('useAdminUserManagement: Error fetching users:', error);
        throw error;
      }

      const managedUsers: ManagedUser[] = (data.users || []).map((profile: any) => {
        const subscriber = profile.subscription;
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: subscriber?.email || profile.email || 'N/A',
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
          user_type: profile.user_type,
          plan: profile.plan,
          account_status: profile.account_status,
          created_at: profile.created_at,
          roles: profile.roles || [],
          subscription_tier: subscriber?.subscription_tier || null,
          subscribed: subscriber?.subscribed || false,
        };
      });

      return managedUsers;
    },
    enabled: typeof window !== 'undefined' && !!sessionStorage.getItem('admin_session_token'),
    staleTime: 0,
    refetchOnMount: true,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      updates 
    }: { 
      userId: string; 
      updates: Partial<{
        first_name: string;
        last_name: string;
        company: string;
        user_type: string;
        plan: string;
        account_status: string;
        suspension_reason: string;
      }>;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      reason 
    }: { 
      userId: string; 
      reason: string;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      toast.success('User suspended successfully');
    },
    onError: (error) => {
      toast.error(`Failed to suspend user: ${error.message}`);
    },
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'active',
          suspended_at: null,
          suspended_by: null,
          suspension_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      toast.success('User unsuspended successfully');
    },
    onError: (error) => {
      toast.error(`Failed to unsuspend user: ${error.message}`);
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: 'admin' | 'manager' | 'user' | 'registered_agent';
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      toast.success('Role assigned successfully');
    },
    onError: (error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      role 
    }: { 
      userId: string; 
      role: string;
    }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      toast.success('Role removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      updates 
    }: { 
      userId: string; 
      updates: {
        subscribed?: boolean;
        subscription_tier?: string;
        is_trial_active?: boolean;
        trial_end?: string | null;
        entities_limit?: number;
        subscription_status?: string;
      };
    }) => {
      const { error } = await supabase
        .from('subscribers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      toast.success('Subscription updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update subscription: ${error.message}`);
    },
  });

  const grantFreeAccessMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      tier,
      entitiesLimit 
    }: { 
      userId: string; 
      tier: string;
      entitiesLimit?: number;
    }) => {
      const { error } = await supabase
        .from('subscribers')
        .update({
          subscribed: true,
          subscription_tier: tier,
          subscription_status: 'active',
          is_trial_active: false,
          entities_limit: entitiesLimit || 999,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      toast.success('Free access granted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to grant free access: ${error.message}`);
    },
  });

  return {
    users: users || [],
    isLoading,
    error,
    refetch,
    updateUser: updateUserMutation.mutate,
    suspendUser: suspendUserMutation.mutate,
    unsuspendUser: unsuspendUserMutation.mutate,
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    updateSubscription: updateSubscriptionMutation.mutate,
    grantFreeAccess: grantFreeAccessMutation.mutate,
    isUpdating: updateUserMutation.isPending,
    isSuspending: suspendUserMutation.isPending,
    isUpdatingSubscription: updateSubscriptionMutation.isPending,
  };
};
