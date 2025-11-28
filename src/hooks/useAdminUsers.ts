import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  user_id: string;
  displayName: string;
  role: string;
}

export const useAdminUsers = () => {
  const { data: adminUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all users with admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) return [];

      // Get profile details for admin users
      const adminUserIds = roles.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, company')
        .in('user_id', adminUserIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      const adminUsers: AdminUser[] = roles.map((role) => {
        const profile = profileMap.get(role.user_id);
        const displayName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.company || 'Unknown'
          : 'Unknown';
        return {
          id: role.id,
          user_id: role.user_id,
          displayName,
          role: 'admin',
        };
      });
      
      return adminUsers;
    },
  });

  return {
    adminUsers: adminUsers || [],
    isLoading,
    error,
    refetch,
  };
};
