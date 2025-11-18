import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

const VALID_TIERS = ["starter", "growth", "professional", "enterprise", "unlimited"] as const;
type TierKey = typeof VALID_TIERS[number];

function priceLookupKey(tier: TierKey, billing: 'monthly' | 'yearly') {
  return `erp:${tier}:${billing}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

  try {
    logStep("Function started");

    const { tier, billing } = await req.json();
    if (!tier || !VALID_TIERS.includes(tier)) {
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
      let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        });
        customerId = created.id;
    }

      if (!customerId) throw new Error("Failed to resolve Stripe customer");

      await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          email: user.email,
          stripe_customer_id: customerId,
          plan_id: tier,
          status: 'pending',
          subscribed: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    const lk = priceLookupKey(tier as TierKey, billing);
    const prices = await stripe.prices.list({ lookup_keys: [lk], active: true, limit: 1 });
    if (prices.data.length === 0) {
      throw new Error(`Price not found for lookup_key ${lk}. Run sync-pricing first.`);
    }
    const priceId = prices.data[0].id;

    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:5173";
      const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      payment_method_collection: "always",
      payment_method_types: ["card"],
      success_url: `${origin}/billing?success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
        billing,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, tier, billing, priceId });

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
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