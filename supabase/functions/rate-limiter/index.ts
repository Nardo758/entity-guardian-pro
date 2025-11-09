import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  endpoint: string;
  useExponentialBackoff?: boolean;
  baseDelaySeconds?: number;
}

const RATE_LIMITS: { [key: string]: RateLimitConfig } = {
  'default': { windowMs: 60000, maxRequests: 100, endpoint: 'default' },
  'auth': { 
    windowMs: 300000, 
    maxRequests: 5, 
    endpoint: 'auth',
    useExponentialBackoff: true,
    baseDelaySeconds: 5 // Start with 5 seconds, doubles each time
  },
  'invitation': { windowMs: 300000, maxRequests: 10, endpoint: 'invitation' },
  'payment': { windowMs: 60000, maxRequests: 5, endpoint: 'payment' },
  'sms-verification': { windowMs: 300000, maxRequests: 3, endpoint: 'sms-verification' },
  'admin-access': { windowMs: 60000, maxRequests: 50, endpoint: 'admin-access' },
  'profile-access': { windowMs: 60000, maxRequests: 20, endpoint: 'profile-access' },
};

// Calculate exponential backoff delay
const calculateBackoffDelay = (failedAttempts: number, baseDelay: number): number => {
  // Exponential backoff: baseDelay * (2 ^ (attempts - 1))
  // Capped at 15 minutes (900 seconds)
  const delay = baseDelay * Math.pow(2, Math.min(failedAttempts - 1, 7));
  return Math.min(delay, 900);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { endpoint = 'default', userId, ipAddress } = await req.json();
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Endpoint is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Clean up old entries
    await supabase
      .from('api_rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());

    // Build identifier for tracking
    const identifier = userId || ipAddress;
    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "Either userId or ipAddress is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check current rate limit
    let query = supabase
      .from('api_rate_limits')
      .select('request_count, metadata')
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    const { data: existing, error: selectError } = await query;

    if (selectError) {
      console.error('Error checking rate limits:', selectError);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const currentRequests = existing?.reduce((sum, record) => sum + record.request_count, 0) || 0;
    
    // Get failed attempts count from metadata
    const latestRecord = existing?.[0];
    const failedAttempts = (latestRecord?.metadata as any)?.failed_attempts || 0;

    if (currentRequests >= config.maxRequests) {
      let retryAfterSeconds = Math.ceil(config.windowMs / 1000);
      
      // Apply exponential backoff if configured
      if (config.useExponentialBackoff && config.baseDelaySeconds) {
        retryAfterSeconds = calculateBackoffDelay(
          failedAttempts + 1,
          config.baseDelaySeconds
        );
      }

      // Log rate limit violation
      await supabase.rpc('log_security_violation', {
        violation_type: 'rate_limit_exceeded',
        user_id_param: userId || null,
        ip_address_param: ipAddress || null,
        details: {
          endpoint,
          current_requests: currentRequests,
          max_requests: config.maxRequests,
          window_ms: config.windowMs,
          failed_attempts: failedAttempts + 1,
          retry_after_seconds: retryAfterSeconds,
          backoff_applied: config.useExponentialBackoff || false
        }
      });

      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          retryAfter: retryAfterSeconds,
          failedAttempts: failedAttempts + 1,
          limit: config.maxRequests,
          windowMs: config.windowMs,
          exponentialBackoff: config.useExponentialBackoff || false
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": retryAfterSeconds.toString()
          } 
        }
      );
    }

    // Record this request with updated metadata
    const newFailedAttempts = currentRequests + 1;
    const { error: insertError } = await supabase
      .from('api_rate_limits')
      .upsert({
        user_id: userId || null,
        ip_address: ipAddress || null,
        endpoint,
        request_count: newFailedAttempts,
        window_start: now.toISOString(),
        updated_at: now.toISOString(),
        metadata: {
          failed_attempts: newFailedAttempts,
          last_attempt: now.toISOString()
        }
      }, {
        onConflict: 'user_id,endpoint,window_start',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('Error recording rate limit:', insertError);
      // Don't fail the request if we can't record the rate limit
    }

    return new Response(
      JSON.stringify({ 
        allowed: true,
        remaining: config.maxRequests - currentRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMs).toISOString(),
        currentAttempts: newFailedAttempts
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Rate limiter error:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

export const verifyJWT = false;