import { useAuth } from '@/contexts/AuthContext';
import { useSecurityMonitor } from './useSecurityMonitor';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminAccess = () => {
  const { profile, user, loading: authLoading } = useAuth();
  const { monitorAdminAccess, monitorUnauthorizedAccess } = useSecurityMonitor();
  
  // Profile is still loading if auth is loading OR if user exists but profile hasn't loaded yet
  const isLoading = authLoading || (!!user && profile === null);
  
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
      
      // Send critical alert for unauthorized sensitive operation attempt
      try {
        await supabase.functions.invoke('send-security-alert', {
          body: {
            actionType: 'unauthorized_sensitive_access',
            actionCategory: 'security',
            severity: 'critical',
            description: `Unauthorized attempt to access sensitive operation: ${operation}`,
            targetUserEmail: user?.email,
            metadata: {
              operation,
              userId: user?.id,
              timestamp: new Date().toISOString()
            }
          }
        });
      } catch (error) {
        console.error('Failed to send security alert:', error);
      }
      
      return false;
    }
    
    await monitorAdminAccess(`sensitive_${operation}`, user?.id);
    return true;
  }, [hasAdminAccess, monitorAdminAccess, monitorUnauthorizedAccess, user?.id, user?.email]);

  return {
    isAdmin,
    isLoading, // NEW: Expose loading state
    hasUnlimitedPlan: profile?.plan === 'unlimited',
    hasAdminAccess,
    checkPermission,
    checkSensitivePermission,
    getUserRoles,
    canAccessAll: hasAdminAccess
  };
};
