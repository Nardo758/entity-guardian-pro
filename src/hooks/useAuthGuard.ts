import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from './useAdminAccess';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  isAuthenticated: boolean;
  role: 'customer' | 'admin' | null;
  loginAttempts: number;
  isLocked: boolean;
  sessionTimeout: number | null;
}

interface ExtendedUserAccount {
  id: string | null;
  email: string | null;
  role: 'customer' | 'admin' | null;
  isAuthenticated: boolean;
  loginAttempts: number;
  isLocked: boolean;
  sessionTimeout: number | null;
  lastActivity: Date | null;
}

export const useAuthGuard = () => {
  const { user, profile, loading, signIn, signOut } = useAuth();
  const { isAdmin } = useAdminAccess();
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    loginAttempts: 0,
    isLocked: false,
    sessionTimeout: null
  });

  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  
  // Session timeout in milliseconds (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;

  // Update authentication state when user/profile changes
  useEffect(() => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: !!user,
      role: isAdmin ? 'admin' : (user ? 'customer' : null)
    }));

    if (user) {
      setLastActivity(new Date());
    }
  }, [user, isAdmin]);

  // Handle session timeout
  useEffect(() => {
    if (!user || !lastActivity) return;

    const checkSession = () => {
      const now = new Date().getTime();
      const lastActivityTime = lastActivity.getTime();
      
      if (now - lastActivityTime > SESSION_TIMEOUT) {
        handleSessionTimeout();
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, lastActivity]);

  // Track user activity to update last activity time
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [user]);

  const handleSessionTimeout = async () => {
    // Log security event for session timeout
    if (user) {
      try {
        await supabase.from('analytics_data').insert({
          user_id: user.id,
          metric_type: 'security_event',
          metric_name: 'session_timeout',
          metric_value: 1,
          metric_date: new Date().toISOString().split('T')[0],
          metadata: {
            last_activity: lastActivity?.toISOString(),
            timeout_duration: SESSION_TIMEOUT,
            user_agent: navigator.userAgent,
          }
        });
      } catch (error) {
        console.error('Failed to log session timeout event:', error);
      }
    }

    await signOut();
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      role: null,
      sessionTimeout: Date.now()
    }));
  };

  const incrementLoginAttempts = () => {
    setAuthState(prev => {
      const newAttempts = prev.loginAttempts + 1;
      return {
        ...prev,
        loginAttempts: newAttempts,
        isLocked: newAttempts >= 5
      };
    });
  };

  const resetLoginAttempts = () => {
    setAuthState(prev => ({
      ...prev,
      loginAttempts: 0,
      isLocked: false
    }));
  };

  const handleSecureLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (authState.isLocked) {
      return { success: false, error: "Account is temporarily locked due to too many failed attempts." };
    }

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        incrementLoginAttempts();
        return { success: false, error: error.message };
      } else {
        resetLoginAttempts();
        return { success: true };
      }
    } catch (error: any) {
      incrementLoginAttempts();
      return { success: false, error: error.message || "An unexpected error occurred." };
    }
  };

  // Extended user account object
  const userAccount: ExtendedUserAccount = {
    id: user?.id || null,
    email: user?.email || null,
    role: authState.role,
    isAuthenticated: authState.isAuthenticated,
    loginAttempts: authState.loginAttempts,
    isLocked: authState.isLocked,
    sessionTimeout: authState.sessionTimeout,
    lastActivity
  };

  const getRedirectPath = () => {
    if (profile?.user_type === 'registered_agent') {
      return '/agent-dashboard';
    } else if (isAdmin) {
      return '/admin-dashboard';
    } else {
      return '/dashboard';
    }
  };

  return {
    userAccount,
    authState,
    loading,
    handleSecureLogin,
    resetLoginAttempts,
    incrementLoginAttempts,
    handleSessionTimeout,
    getRedirectPath,
    isAuthenticated: authState.isAuthenticated,
    role: authState.role,
    isLocked: authState.isLocked
  };
};

export default useAuthGuard;