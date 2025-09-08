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
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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

  // Handle Supabase token hash fragments (e.g. #access_token=...&refresh_token=...)
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
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

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const roles = rolesData?.map(r => r.role) || [];
      const is_admin = roles.includes('admin');

      setProfile({
        ...profileData,
        roles,
        is_admin
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for email:', email);
    
    // Clean up any existing state
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continue even if this fails
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Sign in result:', { data: data?.user?.email, error: error?.message });
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
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
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};