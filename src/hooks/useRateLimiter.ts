import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: string;
  retryAfter?: number;
  error?: string;
}

export const useRateLimiter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkRateLimit = useCallback(async (
    endpoint: string,
    ipAddress?: string
  ): Promise<RateLimitResult> => {
    setLoading(true);
    
    try {
      // Get client IP if not provided
      const clientIP = ipAddress || await getClientIP();
      
      const { data, error } = await supabase.functions.invoke('rate-limiter', {
        body: {
          endpoint,
          userId: user?.id,
          ipAddress: clientIP
        }
      });

      if (error) {
        console.error('Rate limiter error:', error);
        
        // If rate limiter fails, allow the request but log the issue
        return { 
          allowed: true, 
          error: 'Rate limiter service unavailable' 
        };
      }

      return data;
    } catch (error: any) {
      console.error('Rate limit check failed:', error);
      
      // Parse rate limit exceeded response
      if (error.message?.includes('429') || error.status === 429) {
        return {
          allowed: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60 // Default 1 minute retry
        };
      }
      
      // For other errors, allow the request
      return { 
        allowed: true, 
        error: 'Could not verify rate limit' 
      };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const withRateLimit = useCallback(async <T>(
    endpoint: string,
    operation: () => Promise<T>,
    options?: { 
      ipAddress?: string;
      onRateLimited?: (result: RateLimitResult) => void;
    }
  ): Promise<T | null> => {
    const rateLimitResult = await checkRateLimit(endpoint, options?.ipAddress);
    
    if (!rateLimitResult.allowed) {
      if (options?.onRateLimited) {
        options.onRateLimited(rateLimitResult);
      }
      return null;
    }
    
    return await operation();
  }, [checkRateLimit]);

  return {
    checkRateLimit,
    withRateLimit,
    loading
  };
};

// Helper function to get client IP (basic implementation)
const getClientIP = async (): Promise<string> => {
  try {
    // In production, you might want to use a more reliable IP detection service
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Could not determine client IP:', error);
    return '0.0.0.0'; // Fallback IP
  }
};