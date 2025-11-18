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

    const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;
    const body = await req.json();
    const paymentMethodId = body?.payment_method_id;

    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      throw new Error("payment_method_id is required");
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) throw subError;
    if (!subscription?.stripe_customer_id) throw new Error("Stripe customer not found");

    const customerId = subscription.stripe_customer_id;

    // Attach new payment method and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }).catch(async (err) => {
      const code = (err as Stripe.errors.StripeError).code;
      if (code !== 'resource_already_exists') throw err;
    });

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    const { data: existingMethod } = await supabase
      .from('payment_methods')
      .select('stripe_payment_method_id')
      .eq('user_id', user.id)
      .maybeSingle();

    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id);

    await supabase.from('payment_methods').upsert({
      user_id: user.id,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      card_brand: paymentMethod.card?.brand ?? null,
      card_last4: paymentMethod.card?.last4 ?? null,
      card_exp_month: paymentMethod.card?.exp_month ?? null,
      card_exp_year: paymentMethod.card?.exp_year ?? null,
      is_default: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (existingMethod?.stripe_payment_method_id && existingMethod.stripe_payment_method_id !== paymentMethod.id) {
      try {
        await stripe.paymentMethods.detach(existingMethod.stripe_payment_method_id);
      } catch (err) {
        console.warn('Failed to detach old payment method', err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
