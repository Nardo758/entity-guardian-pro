import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const body = await req.json().catch(() => ({}));
    const projectRef = Deno.env.get("SUPABASE_PROJECT_ID") || "wcuxqopfcgivypbiynjp";
    const url = body?.url || `https://${projectRef}.functions.supabase.co/stripe-webhook`;
    const mode: 'test' | 'live' = body?.mode === 'live' ? 'live' : 'test';

    const endpoint = await stripe.webhookEndpoints.create({
      url,
      enabled_events: [
        'checkout.session.completed',
        'invoice.payment_succeeded',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted'
      ],
      description: 'Supabase stripe-webhook handler',
      api_version: '2023-10-16',
    });

    return new Response(JSON.stringify({ id: endpoint.id, secret: endpoint.secret, url: endpoint.url, mode }), {
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