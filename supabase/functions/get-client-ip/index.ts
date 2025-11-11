import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers (Supabase/Deno Deploy provides these)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    
    let clientIP = 'unknown';
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
      // The first one is the actual client IP
      clientIP = forwarded.split(',')[0].trim();
    } else if (realIp) {
      clientIP = realIp;
    }

    return new Response(
      JSON.stringify({ ip: clientIP }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error getting client IP:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get client IP',
        ip: 'unknown' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
