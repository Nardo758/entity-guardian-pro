import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
  mfaEnabled?: boolean;
  isSiteOwner?: boolean;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifySession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_AUTH_URL = 'https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/admin-auth';
const SESSION_KEY = 'admin_session_token';

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(() => {
    // Use sessionStorage - doesn't persist after browser close
    return sessionStorage.getItem(SESSION_KEY);
  }, []);

  const setToken = useCallback((token: string | null) => {
    if (token) {
      sessionStorage.setItem(SESSION_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const verifySession = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setAdmin(null);
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch(`${ADMIN_AUTH_URL}?action=verify-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.valid && data.admin) {
        setAdmin(data.admin);
        return true;
      } else {
        setToken(null);
        setAdmin(null);
        return false;
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      setToken(null);
      setAdmin(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getToken, setToken]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${ADMIN_AUTH_URL}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      if (data.success && data.token) {
        setToken(data.token);
        setAdmin(data.admin);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }, [setToken]);

  const logout = useCallback(async () => {
    const token = getToken();
    
    try {
      if (token) {
        await fetch(`${ADMIN_AUTH_URL}?action=logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setAdmin(null);
    }
  }, [getToken, setToken]);

  // Verify session on mount
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Set up session check interval (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (admin) {
        verifySession();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [admin, verifySession]);

  const value: AdminAuthContextType = {
    admin,
    isLoading,
    isAuthenticated: !!admin,
    login,
    logout,
    verifySession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
