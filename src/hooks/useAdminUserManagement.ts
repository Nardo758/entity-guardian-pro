import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminUserAction {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  action_type: string;
  previous_value?: any;
  new_value?: any;
  reason?: string;
  metadata?: any;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  user_type?: string;
  account_status?: string;
  suspension_reason?: string;
  suspended_at?: string;
  suspended_by?: string;
  plan?: string;
  created_at: string;
  updated_at: string;
}

export const useAdminUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userActions, setUserActions] = useState<AdminUserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('admin_user_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUserActions((data || []) as AdminUserAction[]);
    } catch (error) {
      console.error('Error fetching user actions:', error);
    }
  };

  const suspendUser = async (userId: string, reason: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'suspended',
          suspension_reason: reason,
          suspended_at: new Date().toISOString(),
          suspended_by: user.id
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User suspended successfully');
      await fetchUsers();
      await fetchUserActions();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
      throw error;
    }
  };

  const reactivateUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'active',
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User reactivated successfully');
      await fetchUsers();
      await fetchUserActions();
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Failed to reactivate user');
      throw error;
    }
  };

  const updateUserType = async (userId: string, newUserType: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          user_type: newUserType
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('User type updated successfully');
      await fetchUsers();
      await fetchUserActions();
    } catch (error) {
      console.error('Error updating user type:', error);
      toast.error('Failed to update user type');
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user) return;

    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Note: The auth.users deletion would typically be handled by admin APIs
      // This is a simplified version for the admin interface
      
      toast.success('User deleted successfully');
      await fetchUsers();
      await fetchUserActions();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      throw error;
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'manager' | 'user') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role as any,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Role assigned successfully');
      await fetchUsers();
      await fetchUserActions();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
      throw error;
    }
  };

  const removeRole = async (userId: string, role: 'admin' | 'manager' | 'user') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) throw error;

      toast.success('Role removed successfully');
      await fetchUsers();
      await fetchUserActions();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchUserActions();
    }
  }, [user]);

  return {
    users,
    userActions,
    loading,
    suspendUser,
    reactivateUser,
    updateUserType,
    deleteUser,
    assignRole,
    removeRole,
    refetch: fetchUsers,
  };
};