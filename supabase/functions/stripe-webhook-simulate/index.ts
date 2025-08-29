import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const token = req.headers.get('x-sim-token');
  const expected = Deno.env.get('SIMULATE_TOKEN');
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
  }

  try {
    const { email, tier = 'professional', months = 1 } = await req.json();
    if (!email) throw new Error('email required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const end = new Date();
    end.setMonth(end.getMonth() + Number(months));
    const endIso = end.toISOString();

    await supabase.from('subscribers').upsert({
      email,
      subscribed: true,
      subscription_tier: tier === 'starter' ? 'Starter' : tier === 'enterprise' ? 'Enterprise' : tier === 'unlimited' ? 'Unlimited' : 'Professional',
      subscription_end: endIso,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    return new Response(JSON.stringify({ ok: true, email, end: endIso }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});

export const verifyJWT = false;
