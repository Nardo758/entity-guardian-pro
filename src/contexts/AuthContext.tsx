import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  company_size: string | null;
  plan: string | null;
  user_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  roles?: string[];
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithOAuth: (provider: 'google' | 'microsoft') => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle Supabase token hash fragments and OAuth errors
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for OAuth errors in URL parameters
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      console.error('OAuth Error:', { error, errorDescription });
      // Clear error parameters from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('error_code');
      url.searchParams.delete('error_description');
      url.hash = '';
      window.history.replaceState({}, '', url.toString());
      
      // Show error toast if available
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('oauth-error', { 
          detail: { error, errorDescription } 
        }));
      }
      return;
    }
    
    if (hash && hash.includes('access_token')) {
      (async () => {
        try {
          const params = new URLSearchParams(hash.replace('#', ''));
          const access_token = params.get('access_token') ?? undefined;
          const refresh_token = params.get('refresh_token') ?? undefined;
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) {
              setSession(data.session);
              setUser(data.session?.user ?? null);
            } else {
              console.error('Session setup error:', error);
            }
          }
        } catch (err) {
          console.error('Failed to process auth hash:', err);
        } finally {
          const url = new URL(window.location.href);
          url.hash = '';
          window.history.replaceState({}, '', url.toString());
        }
      })();
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile with roles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        // PGRST116 is "no rows returned" - this is ok for new users
        if (profileError.code !== 'PGRST116') {
          console.warn('Could not fetch profile:', profileError);
        }
        // Set minimal profile so app doesn't break
        setProfile({
          id: userId,
          user_id: userId,
          first_name: null,
          last_name: null,
          company: null,
          company_size: null,
          plan: null,
          user_type: null,
          created_at: null,
          updated_at: null,
          roles: [],
          is_admin: false
        });
        return;
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.warn('Could not fetch roles:', rolesError);
      }

      const roles = rolesData?.map(r => r.role) || [];
      const is_admin = roles.includes('admin');

      setProfile({
        ...profileData,
        roles,
        is_admin
      });
    } catch (error) {
      console.warn('Error fetching profile:', error);
      // Set minimal profile as fallback
      setProfile({
        id: userId,
        user_id: userId,
        first_name: null,
        last_name: null,
        company: null,
        company_size: null,
        plan: null,
        user_type: null,
        created_at: null,
        updated_at: null,
        roles: [],
        is_admin: false
      });
    }
  };

  // Email is sourced from auth.user; profiles table doesn't store email

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        await supabase.functions.invoke('check-subscription');
      } catch (error) {
        console.log('Failed to check subscription status:', error);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Handle session errors by clearing stale data
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.warn('Token refresh failed, clearing session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
          
          // Check subscription status on successful sign-in or token refresh
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setTimeout(() => {
              checkSubscriptionStatus();
            }, 100);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
        
        // Check subscription status for existing session
        setTimeout(() => {
          checkSubscriptionStatus();
        }, 100);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = 'https://entityrenewalpro.com';
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      }
    });
    return { error, data };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for email:', email);
    
    // Clean up any stale refresh tokens from previous sessions
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      // Continue even if this fails
      console.warn('Could not clear previous session:', err);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Sign in result:', { data: data?.user?.email, error: error?.message });
    
    return { error };
  };

  const signInWithOAuth = async (provider: 'google' | 'microsoft') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'microsoft' ? 'azure' : provider,
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (!error) {
      // Clear all session data
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Redirect to sign-out confirmation page
      setTimeout(() => {
        window.location.href = '/sign-out-confirmation';
      }, 100);
    }
    
    return { error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};