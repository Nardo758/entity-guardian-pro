import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe publishable key from Supabase secrets
    const stripePublishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    if (!stripePublishableKey) {
      console.error('STRIPE_PUBLISHABLE_KEY not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe publishable key not configured. Please add STRIPE_PUBLISHABLE_KEY to Supabase project secrets.'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        publishableKey: stripePublishableKey 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error getting Stripe config:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: `Failed to get Stripe configuration: ${errorMessage}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});