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

    const { id } = await req.json();
    if (!id) throw new Error("Missing webhook endpoint id");

    const endpoint = await stripe.webhookEndpoints.retrieve(id);
    return new Response(JSON.stringify({
      id: endpoint.id,
      url: endpoint.url,
      enabled_events: endpoint.enabled_events,
      status: endpoint.status,
      api_version: endpoint.api_version,
      description: endpoint.description,
      created: endpoint.created,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

export const verifyJWT = false;
