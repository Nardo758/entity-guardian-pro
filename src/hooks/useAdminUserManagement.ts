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
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get subscriber info
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('user_id, subscription_tier, subscribed, email');

      if (subscribersError) throw subscribersError;

      // Map roles by user_id
      const roleMap = new Map<string, string[]>();
      (roles || []).forEach(r => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      // Map subscribers by user_id
      const subscriberMap = new Map(
        (subscribers || []).map(s => [s.user_id, s])
      );

      const managedUsers: ManagedUser[] = (profiles || []).map(profile => {
        const subscriber = subscriberMap.get(profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: subscriber?.email || 'N/A',
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
          user_type: profile.user_type,
          plan: profile.plan,
          account_status: profile.account_status,
          created_at: profile.created_at,
          roles: roleMap.get(profile.user_id) || [],
          subscription_tier: subscriber?.subscription_tier || null,
          subscribed: subscriber?.subscribed || false,
        };
      });

      return managedUsers;
    },
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
    isUpdating: updateUserMutation.isPending,
    isSuspending: suspendUserMutation.isPending,
  };
};
