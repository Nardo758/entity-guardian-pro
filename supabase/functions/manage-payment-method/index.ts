// Manage Stripe payment methods: set default or detach
// - set_default: updates customer's default payment method in Stripe and DB
// - detach: detaches a payment method in Stripe and removes it from DB

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.8.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ManageAction = "set_default" | "detach";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing server configuration." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Auth user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, payment_method_id } = await req.json().catch(() => ({ }));
    if (!action || !payment_method_id) {
      return new Response(JSON.stringify({ error: "Missing action or payment_method_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure we know the user's customer id
    const { data: sub, error: subErr } = await supabase
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subErr) throw subErr;
    const customerId = sub?.stripe_customer_id || null;
    if (!customerId) {
      return new Response(JSON.stringify({ error: "No Stripe customer found for user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((action as ManageAction) === "set_default") {
      // Update default payment method in Stripe
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: payment_method_id },
      });

      // Reflect in DB: set this method default and unset others for the user
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);

      await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("user_id", user.id)
        .eq("stripe_payment_method_id", payment_method_id);

      return new Response(JSON.stringify({ ok: true, action: "set_default" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((action as ManageAction) === "detach") {
      // Detach from Stripe
      await stripe.paymentMethods.detach(payment_method_id);

      // Remove from DB
      await supabase
        .from("payment_methods")
        .delete()
        .eq("user_id", user.id)
        .eq("stripe_payment_method_id", payment_method_id);

      return new Response(JSON.stringify({ ok: true, action: "detach" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[manage-payment-method] error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
