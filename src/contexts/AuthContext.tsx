import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Rate limiter utility
const checkRateLimit = async (endpoint: string, userId?: string): Promise<{
  allowed: boolean;
  remaining?: number;
  resetTime?: string;
  retryAfter?: number;
  error?: string;
}> => {
  try {
    const clientIP = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => '0.0.0.0');

    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: {
        endpoint,
        userId,
        ipAddress: clientIP
      }
    });

    if (error) {
      console.error('Rate limiter error:', error);
      // For critical auth operations, fail secure
      return { 
        allowed: false, 
        error: 'Security service temporarily unavailable. Please try again later.',
        retryAfter: 300
      };
    }

    return data;
  } catch (error: any) {
    console.error('Rate limit check failed:', error);
    
    if (error.message?.includes('429') || error.status === 429) {
      return {
        allowed: false,
        error: 'Too many attempts. Please try again later.',
        retryAfter: 60
      };
    }
    
    // For auth endpoints, deny on error
    return { 
      allowed: false, 
      error: 'Security check failed. Please try again.',
      retryAfter: 60
    };
  }
};

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
  ensureProfileExists: (userId: string, metadata?: any, retries?: number) => Promise<boolean>;
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

  // Handle Supabase token hash fragments and OAuth errors with enhanced error handling
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const searchParams = new URLSearchParams(window.location.search);
    
    // Check for OAuth errors in URL parameters
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const errorCode = searchParams.get('error_code');
    
    if (error) {
      console.error('OAuth Error:', { error, errorDescription, errorCode });
      
      // Map error codes to user-friendly messages
      let userMessage = errorDescription || 'Authentication failed. Please try again.';
      
      if (error === 'access_denied') {
        userMessage = 'You denied access to your account. Please try again if you want to sign in.';
      } else if (error === 'server_error') {
        userMessage = 'Authentication service is temporarily unavailable. Please try again later.';
      } else if (errorDescription?.includes('Email not confirmed')) {
        userMessage = 'Please verify your email address before signing in.';
      }
      
      // Clear error parameters from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('error_code');
      url.searchParams.delete('error_description');
      url.hash = '';
      window.history.replaceState({}, '', url.toString());
      
      // Show error to user via custom event
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('oauth-error', { 
          detail: { error, errorDescription: userMessage, errorCode } 
        }));
      }
      return;
    }
    
    // Handle OAuth callback with access token
    if (hash && hash.includes('access_token')) {
      (async () => {
        try {
          const params = new URLSearchParams(hash.replace('#', ''));
          const access_token = params.get('access_token') ?? undefined;
          const refresh_token = params.get('refresh_token') ?? undefined;
          
          if (access_token && refresh_token) {
            console.log('Processing OAuth callback, setting session...');
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
            
            if (error) {
              console.error('Session setup error:', error);
              // Dispatch error event for user notification
              window.dispatchEvent(new CustomEvent('oauth-error', {
                detail: { 
                  error: 'session_error',
                  errorDescription: 'Failed to establish session. Please try signing in again.',
                }
              }));
            } else if (data.session) {
              console.log('OAuth session established successfully');
              setSession(data.session);
              setUser(data.session?.user ?? null);
              
              // Ensure profile exists for OAuth user with their metadata
              if (data.session.user) {
                setTimeout(async () => {
                  const metadata = data.session.user.user_metadata || {};
                  await ensureProfileExists(data.session.user.id, metadata, 5);
                }, 0);
              }
            }
          }
        } catch (err) {
          console.error('Failed to process OAuth callback:', err);
          window.dispatchEvent(new CustomEvent('oauth-error', {
            detail: { 
              error: 'callback_error',
              errorDescription: 'An unexpected error occurred. Please try again.',
            }
          }));
        } finally {
          // Clean up URL
          const url = new URL(window.location.href);
          url.hash = '';
          window.history.replaceState({}, '', url.toString());
        }
      })();
    }
  }, []);

  // Helper to ensure profile exists with retry logic and exponential backoff
  const ensureProfileExists = async (userId: string, metadata?: any, retries = 5): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
      try {
        // Check if profile exists
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          console.log('Profile already exists for user:', userId);
          return true;
        }

        // If profile doesn't exist, try to create it
        if (!data || error?.code === 'PGRST116') {
          console.log(`Creating profile for user ${userId} (attempt ${i + 1}/${retries})`);
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              first_name: metadata?.first_name || null,
              last_name: metadata?.last_name || null,
              company: metadata?.company || null,
              updated_at: new Date().toISOString()
            });

          if (!insertError) {
            console.log('Profile created successfully for user:', userId);
            return true;
          }
          
          // If unique constraint violation, profile was created by another process
          if (insertError.code === '23505') {
            console.log('Profile already exists (race condition resolved)');
            return true;
          }
          
          console.warn(`Profile creation attempt ${i + 1} failed:`, insertError);
        }

        // Wait before retry with exponential backoff (500ms, 1s, 2s, 4s, 8s)
        if (i < retries - 1) {
          const delay = Math.pow(2, i) * 500;
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.warn(`Profile check attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          const delay = Math.pow(2, i) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('Failed to ensure profile exists after all retries');
    return false;
  };

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      // First ensure profile exists
      const profileExists = await ensureProfileExists(userId, retries);
      
      if (!profileExists) {
        console.warn('Could not ensure profile exists after retries');
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
        return;
      }

      // Fetch profile with roles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Could not fetch profile:', profileError);
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
    // Check rate limit first
    const rateLimitResult = await checkRateLimit('auth');
    
    if (!rateLimitResult.allowed) {
      return { 
        error: { 
          message: rateLimitResult.error || 'Too many signup attempts. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        data: null 
      };
    }
    
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        }
      });
      
      if (error) {
        return { error, data };
      }
      
      // Immediately ensure profile is created after successful signup
      if (data.user) {
        console.log('User created, ensuring profile exists:', data.user.id);
        const profileCreated = await ensureProfileExists(data.user.id, metadata, 5);
        
        if (!profileCreated) {
          console.error('Failed to create profile after signup');
          return { 
            error: { message: 'Account created but profile setup failed. Please contact support.' },
            data 
          };
        }
        
        console.log('Profile created successfully after signup');
      }
      
      return { error, data };
    } catch (err: any) {
      console.error('Signup error:', err);
      return { error: err, data: null };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for email:', email);
    
    // Check rate limit first to prevent brute force attacks
    const rateLimitResult = await checkRateLimit('auth');
    
    if (!rateLimitResult.allowed) {
      console.warn('Login rate limit exceeded with progressive backoff');
      
      // Extract reputation data
      const reputationScore = (rateLimitResult as any).reputationScore;
      const riskLevel = (rateLimitResult as any).riskLevel;
      
      let message = rateLimitResult.error || 'Too many login attempts. Please try again later.';
      
      // Add reputation context to message
      if (riskLevel === 'critical') {
        message = 'This IP address has been blocked due to suspicious activity. Please contact support if you believe this is an error.';
      } else if (riskLevel === 'high') {
        message = 'Multiple security violations detected from this IP address. Access temporarily restricted.';
      }
      
      return { 
        error: { 
          message,
          retryAfter: rateLimitResult.retryAfter,
          failedAttempts: (rateLimitResult as any).failedAttempts,
          exponentialBackoff: (rateLimitResult as any).exponentialBackoff,
          reputationScore,
          riskLevel,
          rateLimited: true
        }
      };
    }
    
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
    
    // Update IP reputation for failed auth attempts
    if (error && error.message && !error.message.includes('Email not confirmed')) {
      try {
        const clientIP = await fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => data.ip)
          .catch(() => null);
        
        if (clientIP) {
          await supabase.rpc('update_ip_reputation', {
            p_ip_address: clientIP,
            p_event_type: 'failed_auth',
            p_metadata: {
              email,
              timestamp: new Date().toISOString(),
              error_type: 'invalid_credentials'
            }
          });
        }
      } catch (err) {
        console.warn('Could not update IP reputation:', err);
      }
    }
    
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
    ensureProfileExists,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};