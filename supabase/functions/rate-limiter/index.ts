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
  disableReputationAdjustment?: boolean;
}

const RATE_LIMITS: { [key: string]: RateLimitConfig } = {
  'default': { windowMs: 60000, maxRequests: 100, endpoint: 'default' },
  'auth': { 
    windowMs: 3600000, // 1 hour window
    maxRequests: 15, // 15 attempts per hour - minimum threshold before blocking
    endpoint: 'auth',
    useExponentialBackoff: false, // Disabled to allow full 15 attempts
    baseDelaySeconds: 10,
    disableReputationAdjustment: true // Don't reduce limit based on IP reputation
  },
  'invitation': { windowMs: 3600000, maxRequests: 20, endpoint: 'invitation' },
  'payment': { windowMs: 300000, maxRequests: 10, endpoint: 'payment' },
  'sms-verification': { windowMs: 3600000, maxRequests: 5, endpoint: 'sms-verification' },
  'admin-access': { windowMs: 60000, maxRequests: 50, endpoint: 'admin-access' },
  'profile-access': { windowMs: 60000, maxRequests: 30, endpoint: 'profile-access' },
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

    const { endpoint = 'default', userId, ipAddress: rawIpAddress } = await req.json();
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Endpoint is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate and sanitize IP address
    // Reject invalid IP strings like "client", "unknown", etc.
    const isValidIP = (ip: string): boolean => {
      if (!ip || ip === 'unknown' || ip === 'client' || ip.length < 7) {
        return false;
      }
      // Basic IPv4 or IPv6 validation
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip.includes(':');
    };

    const ipAddress = rawIpAddress && isValidIP(rawIpAddress) ? rawIpAddress : null;

    // Build identifier for tracking
    const identifier = userId || ipAddress;
    if (!identifier) {
      return new Response(
        JSON.stringify({ error: "Either userId or valid ipAddress is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check IP reputation first if IP address is provided
    let ipReputationData: any = null;
    let adjustedMaxRequests = null;
    
    if (ipAddress) {
      const { data: ipRepData, error: ipRepError } = await supabase
        .from('ip_reputation')
        .select('reputation_score, risk_level, blocked_until')
        .eq('ip_address', ipAddress)
        .maybeSingle();
      
      if (!ipRepError && ipRepData) {
        ipReputationData = ipRepData;
        
        // Check if IP is blocked
        if (ipRepData.blocked_until && new Date(ipRepData.blocked_until) > new Date()) {
          const blockedUntil = new Date(ipRepData.blocked_until);
          const retryAfter = Math.ceil((blockedUntil.getTime() - Date.now()) / 1000);
          
          console.log(`IP ${ipAddress} is blocked until ${ipRepData.blocked_until}`);
          
          return new Response(
            JSON.stringify({ 
              error: "IP address blocked due to suspicious activity",
              retryAfter,
              riskLevel: ipRepData.risk_level,
              reputationScore: ipRepData.reputation_score,
              blockedUntil: ipRepData.blocked_until
            }),
            { 
              status: 403, 
              headers: { 
                ...corsHeaders, 
                "Content-Type": "application/json",
                "Retry-After": retryAfter.toString()
              } 
            }
          );
        }
      }
    }

    const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
    let maxRequests = config.maxRequests;
    
    // Adjust rate limits based on IP reputation (unless disabled for this endpoint)
    if (ipReputationData && !(config as any).disableReputationAdjustment) {
      const score = ipReputationData.reputation_score;
      if (score < 30) {
        // Critical risk: 25% of normal limits
        maxRequests = Math.max(1, Math.floor(config.maxRequests * 0.25));
      } else if (score < 60) {
        // High risk: 50% of normal limits
        maxRequests = Math.max(2, Math.floor(config.maxRequests * 0.5));
      } else if (score < 80) {
        // Medium risk: 75% of normal limits
        maxRequests = Math.max(3, Math.floor(config.maxRequests * 0.75));
      }
      // Low risk (>=80): Use normal limits
      
      console.log(`IP ${ipAddress} reputation: ${score}, adjusted limit: ${maxRequests} (from ${config.maxRequests})`);
    } else if ((config as any).disableReputationAdjustment) {
      console.log(`IP reputation adjustments disabled for ${endpoint}, using full limit: ${maxRequests}`);
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Clean up old entries
    await supabase
      .from('api_rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());

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

    if (currentRequests >= maxRequests) {
      let retryAfterSeconds = Math.ceil(config.windowMs / 1000);
      
      // Apply exponential backoff if configured
      if (config.useExponentialBackoff && config.baseDelaySeconds) {
        retryAfterSeconds = calculateBackoffDelay(
          failedAttempts + 1,
          config.baseDelaySeconds
        );
      }

      // Update IP reputation for rate limit violation
      if (ipAddress) {
        const { data: repUpdateData } = await supabase.rpc('update_ip_reputation', {
          p_ip_address: ipAddress,
          p_event_type: 'rate_limit',
          p_metadata: {
            endpoint,
            user_id: userId,
            timestamp: now.toISOString(),
            current_requests: currentRequests,
            max_requests: maxRequests
          }
        });
        
        if (repUpdateData && repUpdateData.length > 0) {
          console.log(`Updated IP reputation for ${ipAddress}: score=${repUpdateData[0].reputation_score}, risk=${repUpdateData[0].risk_level}`);
        }
      }

      // Log rate limit violation
      await supabase.rpc('log_security_violation', {
        violation_type: 'rate_limit_exceeded',
        user_id_param: userId || null,
        ip_address_param: ipAddress || null,
        details: {
          endpoint,
          current_requests: currentRequests,
          max_requests: maxRequests,
          adjusted_limit: maxRequests !== config.maxRequests,
          original_limit: config.maxRequests,
          window_ms: config.windowMs,
          failed_attempts: failedAttempts + 1,
          retry_after_seconds: retryAfterSeconds,
          backoff_applied: config.useExponentialBackoff || false,
          reputation_score: ipReputationData?.reputation_score,
          risk_level: ipReputationData?.risk_level
        }
      });

      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          retryAfter: retryAfterSeconds,
          failedAttempts: failedAttempts + 1,
          limit: maxRequests,
          windowMs: config.windowMs,
          exponentialBackoff: config.useExponentialBackoff || false,
          reputationScore: ipReputationData?.reputation_score,
          riskLevel: ipReputationData?.risk_level
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
        remaining: maxRequests - currentRequests - 1,
        resetTime: new Date(now.getTime() + config.windowMs).toISOString(),
        currentAttempts: newFailedAttempts,
        reputationScore: ipReputationData?.reputation_score,
        riskLevel: ipReputationData?.risk_level,
        adjustedLimit: maxRequests !== config.maxRequests
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