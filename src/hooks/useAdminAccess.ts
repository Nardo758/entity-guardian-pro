import { useAuth } from '@/contexts/AuthContext';
import { useSecurityMonitor } from './useSecurityMonitor';
import { useCallback } from 'react';

export const useAdminAccess = () => {
  const { profile, user } = useAuth();
  const { monitorAdminAccess, monitorUnauthorizedAccess } = useSecurityMonitor();
  
  // Only check explicit admin roles, not subscription plans
  const isAdmin = profile?.roles?.includes('admin') || false;
  const hasAdminAccess = isAdmin;
  
  const checkPermission = useCallback(async (requiredRole?: string, resourceName?: string) => {
    if (hasAdminAccess) {
      // Log admin access for audit trail
      if (resourceName) {
        await monitorAdminAccess(`access_${resourceName}`, user?.id);
      }
      return true;
    }
    
    if (!requiredRole) return true;
    
    const hasPermission = profile?.roles?.includes(requiredRole) || false;
    
    // Log unauthorized access attempts
    if (!hasPermission && requiredRole && resourceName) {
      await monitorUnauthorizedAccess(resourceName, requiredRole);
    }
    
    return hasPermission;
  }, [hasAdminAccess, profile?.roles, monitorAdminAccess, monitorUnauthorizedAccess, user?.id]);

  const getUserRoles = () => profile?.roles || [];

  // Enhanced security check for sensitive operations
  const checkSensitivePermission = useCallback(async (operation: string) => {
    if (!hasAdminAccess) {
      await monitorUnauthorizedAccess('sensitive_operation', 'admin');
      return false;
    }
    
    await monitorAdminAccess(`sensitive_${operation}`, user?.id);
    return true;
  }, [hasAdminAccess, monitorAdminAccess, monitorUnauthorizedAccess, user?.id]);

  return {
    isAdmin,
    hasUnlimitedPlan: profile?.plan === 'unlimited',
    hasAdminAccess,
    checkPermission,
    checkSensitivePermission,
    getUserRoles,
    canAccessAll: hasAdminAccess
  };
};