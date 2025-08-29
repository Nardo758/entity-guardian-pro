import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAID-REGISTRATION] ${step}${detailsStr}`);
};

const VALID_TIERS = ["starter", "professional", "enterprise", "unlimited"] as const;
type TierKey = typeof VALID_TIERS[number];

function priceLookupKey(tier: TierKey, billing: 'monthly' | 'yearly') {
  return `erp:${tier}:${billing}`;
}

serve(async (req) => {
  console.log("[DEBUG] Request received, method:", req.method);
  console.log("[DEBUG] Request headers:", Object.fromEntries(req.headers.entries()));
  
  if (req.method === "OPTIONS") {
    console.log("[DEBUG] OPTIONS request, returning CORS headers");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    console.log("[DEBUG] Environment variables check:");
    console.log("[DEBUG] STRIPE_SECRET_KEY exists:", !!Deno.env.get("STRIPE_SECRET_KEY"));
    console.log("[DEBUG] STRIPE_SECRET_KEY length:", Deno.env.get("STRIPE_SECRET_KEY")?.length || 0);

    const requestBody = await req.json();
    console.log("[DEBUG] Request body received:", JSON.stringify(requestBody, null, 2));

    const { 
      email, 
      password, 
      userData, 
      tier, 
      billing 
    } = requestBody;

    if (!email || !password || !userData || !tier || !billing) {
      throw new Error("Missing required fields");
    }

    if (!VALID_TIERS.includes(tier)) {
      throw new Error("Invalid pricing tier");
    }

    if (!['monthly', 'yearly'].includes(billing)) {
      throw new Error("Invalid billing period");
    }

    logStep("Request validated", { email, tier, billing });

    // Check for Stripe secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    logStep("Stripe key found");

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      logStep("Existing customer found", { customerId: customer.id });
    } else {
      customer = await stripe.customers.create({
        email,
        name: `${userData.first_name} ${userData.last_name}`,
        metadata: {
          company: userData.company,
          company_size: userData.company_size,
        },
      });
      logStep("New customer created", { customerId: customer.id });
    }

    // Retrieve amount from Stripe Price via lookup key to stay in sync
    const lk = priceLookupKey(tier as TierKey, billing);
    const prices = await stripe.prices.list({ lookup_keys: [lk], active: true, limit: 1 });
    if (prices.data.length === 0) {
      throw new Error(`Price not found for lookup_key ${lk}. Run sync-pricing first.`);
    }
    const price = prices.data[0];
    const amount = price.unit_amount || 0;

    // Create payment intent for immediate payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customer.id,
      setup_future_usage: "off_session", // For future subscription payments
      automatic_payment_methods: { enabled: true },
      metadata: {
        email,
        tier,
        billing,
        registration: "true",
        first_name: userData.first_name,
        last_name: userData.last_name,
        company: userData.company,
        company_size: userData.company_size,
      },
      description: price.nickname || `Entity Renewal Pro - ${tier} Plan (${billing})`,
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id, 
      amount, 
      tier, 
      billing 
    });

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      paymentIntentId: paymentIntent.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-paid-registration", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});