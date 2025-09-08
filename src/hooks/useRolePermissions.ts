import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface RolePermissions {
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canManageAgents: boolean;
  canCreateSupportTickets: boolean;
  canViewAllTickets: boolean;
  canManageInvoices: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isEntityOwner: boolean;
}

export const useRolePermissions = () => {
  const { profile, user } = useAuth();

  const { data: userRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data?.map(r => r.role) || [];
    },
    enabled: !!user?.id,
  });

  const roles = userRoles || [];
  const userType = profile?.user_type || 'entity_owner';
  
  const permissions: RolePermissions = {
    canAccessAdmin: roles.includes('admin'),
    canManageUsers: roles.includes('admin'),
    canViewAnalytics: roles.includes('admin') || userType === 'entity_owner',
    canManageAgents: userType === 'registered_agent' || roles.includes('admin'),
    canCreateSupportTickets: true, // All users can create tickets
    canViewAllTickets: roles.includes('admin'),
    canManageInvoices: userType === 'registered_agent' || roles.includes('admin'),
    isAdmin: roles.includes('admin'),
    isAgent: userType === 'registered_agent',
    isEntityOwner: userType === 'entity_owner',
  };

  return {
    permissions,
    roles,
    userType,
    hasRole: (role: any) => roles.includes(role),
    hasAnyRole: (roleList: any[]) => roleList.some(role => roles.includes(role)),
  };
};