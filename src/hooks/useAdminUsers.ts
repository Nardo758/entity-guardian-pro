import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

export const useAdminUsers = () => {
  const { data: adminUsers, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all users with admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) return [];

      // Get user details from auth.users
      const { data, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;
      
      const users = data?.users || [];

      const adminUserIds = new Set(roles.map(r => r.user_id));
      
      const adminUsers: AdminUser[] = users
        .filter((user: any) => adminUserIds.has(user.id))
        .map((user: any) => ({
          id: user.id,
          email: user.email || '',
          role: 'admin' as const,
        }));
      
      return adminUsers;
    },
  });

  return {
    adminUsers: adminUsers || [],
    isLoading,
    error,
  };
};
