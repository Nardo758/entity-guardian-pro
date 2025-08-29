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

const PRICING_TIERS = {
  starter: { 
    monthly: 2500, // $25
    yearly: 24900, // $249 (17% discount)
    name: "Starter"
  },
  professional: { 
    monthly: 9900, // $99
    yearly: 98604, // $986.04 (17% discount)
    name: "Professional"
  },
  enterprise: { 
    monthly: 20000, // $200
    yearly: 199200, // $1,992 (17% discount)
    name: "Enterprise"
  },
  unlimited: { 
    monthly: 35000, // $350
    yearly: 348600, // $3,486 (17% discount)
    name: "Unlimited"
  }
};

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

    if (!PRICING_TIERS[tier as keyof typeof PRICING_TIERS]) {
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

    const selectedTier = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];
    const amount = selectedTier[billing as keyof typeof selectedTier] as number;

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
      description: `Entity Renewal Pro - ${selectedTier.name} Plan (${billing})`,
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