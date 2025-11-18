import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !serviceRole) {
      throw new Error("Server configuration missing");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Ensure we have a Stripe customer id
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subError) throw subError;

    let customerId = subscription?.stripe_customer_id || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? subscription?.email ?? undefined,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          email: user.email ?? subscription?.email ?? "",
          stripe_customer_id: customerId,
          plan_id: subscription?.plan_id ?? 'free',
          status: subscription?.status ?? 'inactive',
          subscribed: subscription?.subscribed ?? false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ clientSecret: setupIntent.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

export const verifyJWT = false;
