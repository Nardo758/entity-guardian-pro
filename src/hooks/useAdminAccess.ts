import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { profile } = useAuth();
  
  // Only check explicit admin roles, not subscription plans
  const isAdmin = profile?.roles?.includes('admin') || false;
  const hasAdminAccess = isAdmin;
  
  const checkPermission = (requiredRole?: string) => {
    if (hasAdminAccess) return true;
    if (!requiredRole) return true;
    return profile?.roles?.includes(requiredRole) || false;
  };

  const getUserRoles = () => profile?.roles || [];

  return {
    isAdmin,
    hasUnlimitedPlan: profile?.plan === 'unlimited',
    hasAdminAccess,
    checkPermission,
    getUserRoles,
    canAccessAll: hasAdminAccess
  };
};