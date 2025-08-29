import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { tier, billing } = await req.json();
    if (!tier || !PRICING_TIERS[tier as keyof typeof PRICING_TIERS]) {
      throw new Error("Invalid pricing tier");
    }
    if (!billing || !['monthly', 'yearly'].includes(billing)) {
      throw new Error("Invalid billing period");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email, tier, billing });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const selectedTier = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];
    const amount = selectedTier[billing as keyof typeof selectedTier] as number;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Entity Renewal Pro - ${selectedTier.name}`,
              description: `${selectedTier.name} plan - ${billing === 'yearly' ? 'Annual' : 'Monthly'} billing`
            },
            unit_amount: amount,
            recurring: { 
              interval: billing === 'yearly' ? 'year' : 'month'
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/billing?success=true`,
      cancel_url: `${req.headers.get("origin")}/billing?canceled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id, tier, billing, amount });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});