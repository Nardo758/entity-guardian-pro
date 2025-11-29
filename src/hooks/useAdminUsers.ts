import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  is_active: boolean;
  created_at: string;
  mfa_enabled: boolean;
  last_login_at: string | null;
  permissions: string[];
  isSiteOwner: boolean;
}

export const useAdminUsers = () => {
  const { data: adminUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => {
      // Get admin session token from sessionStorage
      const sessionToken = sessionStorage.getItem('admin_session_token');
      
      if (!sessionToken) {
        console.error('No admin session token found');
        return [];
      }

      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: { type: 'admin_accounts' },
      });

      if (error) {
        console.error('Error fetching admin accounts:', error);
        throw error;
      }

      const adminAccounts: AdminUser[] = (data.adminAccounts || []).map((admin: any) => ({
        id: admin.id,
        email: admin.email,
        displayName: admin.display_name,
        is_active: admin.is_active,
        created_at: admin.created_at,
        mfa_enabled: admin.mfa_enabled,
        last_login_at: admin.last_login_at,
        permissions: admin.permissions || [],
        isSiteOwner: admin.is_site_owner || false,
      }));
      
      return adminAccounts;
    },
  });

  return {
    adminUsers: adminUsers || [],
    isLoading,
    error,
    refetch,
  };
};
