import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logSecurityEvent, SecurityEventType } from '@/lib/security';
import { toast } from 'sonner';

export const useAdminSecurity = () => {
  const { user, profile } = useAuth();

  const validateAdminAction = useCallback((actionName: string): boolean => {
    if (!user) {
      toast.error('Authentication required');
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        action: actionName,
        reason: 'not_authenticated'
      });
      return false;
    }

    if (!profile?.roles?.includes('admin')) {
      toast.error('Administrator privileges required');
      logSecurityEvent(SecurityEventType.UNAUTHORIZED_ACCESS, {
        action: actionName,
        user_id: user.id,
        reason: 'insufficient_privileges'
      });
      return false;
    }

    return true;
  }, [user, profile]);

  const logAdminOperation = useCallback(async (
    operationType: string,
    targetUserId?: string,
    operationData: Record<string, any> = {}
  ) => {
    if (!validateAdminAction(operationType)) {
      return false;
    }

    try {
      // Log to database using the new secure function
      await supabase.rpc('log_admin_operation', {
        operation_type: operationType,
        target_user_id: targetUserId,
        operation_data: operationData
      });

      // Also log locally for immediate feedback
      logSecurityEvent(SecurityEventType.ADMIN_ACTION, {
        operation: operationType,
        target_user_id: targetUserId,
        admin_user_id: user?.id,
        ...operationData
      });

      return true;
    } catch (error) {
      console.error('Failed to log admin operation:', error);
      toast.error('Failed to log security event');
      return false;
    }
  }, [user, validateAdminAction]);

  const executeSecureAdminAction = useCallback(async <T>(
    actionName: string,
    action: () => Promise<T>,
    targetUserId?: string,
    metadata: Record<string, any> = {}
  ): Promise<T | null> => {
    if (!validateAdminAction(actionName)) {
      return null;
    }

    try {
      // Log the operation start
      await logAdminOperation(`${actionName}_start`, targetUserId, metadata);
      
      // Execute the action
      const result = await action();
      
      // Log successful completion
      await logAdminOperation(`${actionName}_success`, targetUserId, { 
        ...metadata,
        result_preview: typeof result === 'object' ? 'object' : String(result)
      });
      
      return result;
    } catch (error) {
      // Log the failure
      await logAdminOperation(`${actionName}_failure`, targetUserId, {
        ...metadata,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.error(`Admin action ${actionName} failed:`, error);
      toast.error(`Failed to ${actionName.replace('_', ' ')}`);
      throw error;
    }
  }, [validateAdminAction, logAdminOperation]);

  const suspendUser = useCallback(async (
    userId: string,
    reason: string,
    duration?: number
  ) => {
    return executeSecureAdminAction(
      'suspend_user',
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            account_status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspended_by: user?.id,
            suspension_reason: reason
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        
        toast.success('User suspended successfully');
        return data;
      },
      userId,
      { reason, duration }
    );
  }, [executeSecureAdminAction, user?.id]);

  const reactivateUser = useCallback(async (userId: string) => {
    return executeSecureAdminAction(
      'reactivate_user',
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            account_status: 'active',
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        
        toast.success('User reactivated successfully');
        return data;
      },
      userId
    );
  }, [executeSecureAdminAction]);

  const assignRole = useCallback(async (
    userId: string, 
    role: 'admin' | 'manager' | 'user'
  ) => {
    return executeSecureAdminAction(
      'assign_role',
      async () => {
        const { data, error } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: role
          })
          .select()
          .single();

        if (error) throw error;
        
        toast.success(`Role ${role} assigned successfully`);
        return data;
      },
      userId,
      { role }
    );
  }, [executeSecureAdminAction]);

  const removeRole = useCallback(async (
    userId: string,
    role: 'admin' | 'manager' | 'user'
  ) => {
    return executeSecureAdminAction(
      'remove_role',
      async () => {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;
        
        toast.success(`Role ${role} removed successfully`);
        return true;
      },
      userId,
      { role }
    );
  }, [executeSecureAdminAction]);

  const updateUserProfile = useCallback(async (
    userId: string,
    updates: Record<string, any>
  ) => {
    return executeSecureAdminAction(
      'update_user_profile',
      async () => {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        
        toast.success('User profile updated successfully');
        return data;
      },
      userId,
      { updates: Object.keys(updates) }
    );
  }, [executeSecureAdminAction]);

  return {
    validateAdminAction,
    logAdminOperation,
    executeSecureAdminAction,
    suspendUser,
    reactivateUser,
    assignRole,
    removeRole,
    updateUserProfile
  };
};

export default useAdminSecurity;