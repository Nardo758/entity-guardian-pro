import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { profile } = useAuth();
  
  const isAdmin = profile?.is_admin || profile?.roles?.includes('admin') || false;
  const hasUnlimitedPlan = profile?.plan === 'unlimited';
  const hasAdminAccess = isAdmin || hasUnlimitedPlan;
  
  const checkPermission = (requiredRole?: string) => {
    if (hasAdminAccess) return true;
    if (!requiredRole) return true;
    return profile?.roles?.includes(requiredRole) || false;
  };

  const getUserRoles = () => profile?.roles || [];

  return {
    isAdmin,
    hasUnlimitedPlan,
    hasAdminAccess,
    checkPermission,
    getUserRoles,
    canAccessAll: hasAdminAccess
  };
};