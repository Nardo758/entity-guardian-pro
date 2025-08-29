import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(signature);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set");

    const body = await req.json().catch(() => ({}));
    const email: string = body.email || "test-webhook@entityrenewalpro.com";
    const url: string = body.url || `https://wcuxqopfcgivypbiynjp.functions.supabase.co/stripe-webhook`;

    const now = Math.floor(Date.now() / 1000);
    const eventPayload = {
      id: `evt_test_${now}`,
      object: "event",
      api_version: "2023-10-16",
      created: now,
      livemode: true,
      pending_webhooks: 1,
      request: { id: null, idempotency_key: null },
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_test_${now}`,
          object: "checkout.session",
          mode: "subscription",
          customer: null,
          customer_details: { email },
          subscription: null,
        },
      },
    };

    const payloadStr = JSON.stringify(eventPayload);
    const signed = await hmacSha256Hex(webhookSecret, `${now}.${payloadStr}`);
    const sigHeader = `t=${now},v1=${signed}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": sigHeader,
      },
      body: payloadStr,
    });

    const text = await resp.text();
    return new Response(JSON.stringify({ status: resp.status, body: text }), {
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

