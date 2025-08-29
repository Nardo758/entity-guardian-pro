import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const log = (msg: string, details?: unknown) => {
  console.log(`[STRIPE-WEBHOOK] ${msg}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeSecretKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Stripe secrets not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

  const body = await req.text();

  // Test bypass: allow injection with shared token for simulation
  const testBypass = req.headers.get('x-test-webhook');
  const simulateToken = Deno.env.get('SIMULATE_TOKEN');
  let event: Stripe.Event;
  if (testBypass && simulateToken && testBypass === simulateToken) {
    log('Bypassing signature for test webhook');
    event = JSON.parse(body);
  } else {
    const signature = req.headers.get("stripe-signature") || req.headers.get("Stripe-Signature");
    try {
      event = stripe.webhooks.constructEvent(body, signature || "", webhookSecret);
    } catch (err) {
      log("Signature verification failed", { message: (err as Error).message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  }

  // Supabase client with service role for writes
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        log('checkout.session.completed', { id: session.id, customer: session.customer });

        let customerEmail = session.customer_details?.email || undefined;
        let customerId = typeof session.customer === 'string' ? session.customer : undefined;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;

        if (!customerEmail && customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          customerEmail = (customer as any)?.email || undefined;
        }

        let subscriptionTier: string | null = null;
        let subscriptionEnd: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
          const price = sub.items.data[0].price;
          const lookupKey = price.lookup_key || null;
          if (lookupKey) {
            const [, tierId] = (lookupKey as string).split(":");
            subscriptionTier = tierId === 'starter' ? 'Starter'
              : tierId === 'professional' ? 'Professional'
              : tierId === 'enterprise' ? 'Enterprise'
              : tierId === 'unlimited' ? 'Unlimited'
              : null;
          }
        }

        if (customerEmail) {
          await supabase.from('subscribers').upsert({
            email: customerEmail,
            stripe_customer_id: customerId || null,
            subscribed: true,
            subscription_tier: subscriptionTier,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        log('invoice.payment_succeeded', { id: invoice.id, customer: invoice.customer });
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined;
        const customerEmail = invoice.customer_email || undefined;
        if (customerEmail || customerId) {
          await supabase.from('subscribers').upsert({
            email: customerEmail || undefined,
            stripe_customer_id: customerId || null,
            subscribed: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
        }
        break;
      }

      default:
        log('Unhandled event', { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    log('handler error', { message: (err as Error).message });
    return new Response(JSON.stringify({ error: 'handler error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

export const verifyJWT = false;
