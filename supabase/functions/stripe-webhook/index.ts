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
  const webhookSecretTest = Deno.env.get("STRIPE_WEBHOOK_SECRET_TEST");
  const cliWebhookSecret = Deno.env.get("STRIPE_CLI_WEBHOOK_SECRET");
  
  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  if (!webhookSecret && !webhookSecretTest && !cliWebhookSecret) {
    log("Warning: No webhook secret configured");
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
  const body = await req.text();

  // Supabase client with service role for writes
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Webhook signature verification
  const signature = req.headers.get("stripe-signature") || req.headers.get("Stripe-Signature");
  let event: Stripe.Event;
  
  try {
    // Try primary webhook secret first (use async version for Deno)
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature || "", webhookSecret);
    } else if (webhookSecretTest) {
      event = await stripe.webhooks.constructEventAsync(body, signature || "", webhookSecretTest);
    } else if (cliWebhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature || "", cliWebhookSecret);
    } else {
      log("No webhook secret available, skipping signature verification (DEV ONLY)");
      event = JSON.parse(body);
    }
  } catch (err) {
    log("Signature verification failed", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  log(`Processing event: ${event.type}`, { id: event.id });

  // Log event to database (prevents duplicate processing)
  try {
    const { error: logError } = await supabase.rpc('log_stripe_event', {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
      p_event_data: event as any
    });

    if (logError) {
      // Check if it's a duplicate event (already processed)
      if (logError.message?.includes('duplicate') || logError.code === '23505') {
        log(`Duplicate event detected: ${event.id}`, { type: event.type });
        return new Response(JSON.stringify({ received: true, status: 'duplicate' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      log("Failed to log event", { error: logError.message });
    }
  } catch (err) {
    log("Error logging event (function may not exist yet)", { error: (err as Error).message });
  }

  // Process the event
  let errorMessage: string | null = null;

    const getUserIdForCustomer = async (customerId?: string, fallbackUserId?: string) => {
      if (fallbackUserId) return fallbackUserId;
      if (!customerId) return undefined;
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      return data?.user_id ?? undefined;
    };

    const upsertSubscriptionFallback = async ({
      customerId,
      subscription,
      priceId,
      status,
      userId,
    }: {
      customerId: string;
      subscription: Stripe.Subscription;
      priceId?: string;
      status: string;
      userId?: string;
    }) => {
      const lookupKey = subscription.items.data[0]?.price?.lookup_key;
      const [, tier, billing] = lookupKey?.split(':') ?? [];
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        email: subscription.metadata?.email ?? subscription.customer_email ?? undefined,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId ?? subscription.items.data[0]?.price?.id,
        plan_id: tier ?? subscription.metadata?.plan_id ?? 'free',
        status,
        subscribed: status === 'active',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        billing_cycle: billing ?? (lookupKey?.includes('year') ? 'yearly' : 'monthly'),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_customer_id' });
    };

    try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        log('Processing checkout.session.completed', { id: session.id });

        const customerId = typeof session.customer === 'string' ? session.customer : undefined;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined;
        const paymentMethodId = typeof session.payment_method === 'string' ? session.payment_method : undefined;
          const metadataUserId = session.metadata?.user_id || session.metadata?.userId || session.metadata?.userID;

        if (subscriptionId && customerId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;

          try {
              await supabase.rpc('update_subscription_from_webhook', {
              p_stripe_customer_id: customerId,
              p_stripe_subscription_id: subscriptionId,
              p_stripe_price_id: priceId,
              p_subscription_status: subscription.status,
              p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              p_cancel_at_period_end: subscription.cancel_at_period_end
            });
            log('Updated subscriber via database function');
          } catch (err) {
              log("Database function not available, using fallback", { error: (err as Error).message });
              await upsertSubscriptionFallback({
                customerId,
                subscription,
                priceId: priceId ?? undefined,
                status: subscription.status,
                userId: metadataUserId,
              });
          }

          // Save payment method if available
          if (paymentMethodId) {
            try {
              const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

                const userId = (await getUserIdForCustomer(customerId, metadataUserId));

                if (userId && paymentMethod.card) {
                  await supabase
                    .from('payment_methods')
                    .update({ is_default: false })
                    .eq('user_id', userId);

                await supabase.from('payment_methods').upsert({
                    user_id: userId,
                  stripe_payment_method_id: paymentMethod.id,
                  type: paymentMethod.type,
                  card_brand: paymentMethod.card.brand,
                  card_last4: paymentMethod.card.last4,
                  card_exp_month: paymentMethod.card.exp_month,
                  card_exp_year: paymentMethod.card.exp_year,
                  is_default: true,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'stripe_payment_method_id' });

                log('Payment method saved', { paymentMethodId });
              }
            } catch (err) {
              log("Failed to save payment method", { error: (err as Error).message });
            }
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        log(`Processing ${event.type}`, { id: subscription.id });

        const customerId = typeof subscription.customer === 'string' ? subscription.customer : undefined;
        const priceId = subscription.items.data[0]?.price?.id;

        if (customerId) {
          try {
              await supabase.rpc('update_subscription_from_webhook', {
              p_stripe_customer_id: customerId,
              p_stripe_subscription_id: subscription.id,
              p_stripe_price_id: priceId,
              p_subscription_status: subscription.status,
              p_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              p_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              p_cancel_at_period_end: subscription.cancel_at_period_end
            });
            log('Updated subscriber via database function');
          } catch (err) {
            log("Database function not available, using fallback", { error: (err as Error).message });
              await upsertSubscriptionFallback({
                customerId,
                subscription,
                priceId,
                status: subscription.status,
                userId: subscription.metadata?.user_id,
              });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        log('Processing subscription deletion', { id: subscription.id });

        const customerId = typeof subscription.customer === 'string' ? subscription.customer : undefined;
        if (customerId) {
            await supabase.from('subscriptions')
            .update({
              subscribed: false,
                status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        log('Processing invoice.payment_succeeded', { id: invoice.id });

        const customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined;
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : undefined;

        // Find user_id from customer_id
          const { data: subscription } = await supabase
            .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();

        // Try to insert invoice record
        try {
          await supabase.from('stripe_invoices').insert({
            stripe_invoice_id: invoice.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
               user_id: subscription?.user_id,
            amount_due: invoice.amount_due,
            amount_paid: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status || 'paid',
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            paid_at: new Date().toISOString(),
          });
          log('Invoice record created');
        } catch (err) {
          log("Failed to create invoice record (table may not exist)", { error: (err as Error).message });
        }

        // Update subscriber status
        if (customerId) {
            await supabase.from('subscriptions')
            .update({
              subscribed: true,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        log('Processing invoice.payment_failed', { id: invoice.id });

        const customerId = typeof invoice.customer === 'string' ? invoice.customer : undefined;
        if (customerId) {
            await supabase.from('subscriptions')
            .update({
                status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

        case 'payment_method.attached': {
          const paymentMethod = event.data.object as Stripe.PaymentMethod;
          const customerId = typeof paymentMethod.customer === 'string' ? paymentMethod.customer : undefined;
          const userId = await getUserIdForCustomer(customerId);
          if (userId && paymentMethod.card) {
            await supabase
              .from('payment_methods')
              .update({ is_default: false })
              .eq('user_id', userId);

            await supabase.from('payment_methods').upsert({
              user_id: userId,
              stripe_payment_method_id: paymentMethod.id,
              type: paymentMethod.type,
              card_brand: paymentMethod.card.brand,
              card_last4: paymentMethod.card.last4,
              card_exp_month: paymentMethod.card.exp_month,
              card_exp_year: paymentMethod.card.exp_year,
              is_default: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

            log('Payment method attached event persisted', { paymentMethodId: paymentMethod.id });
          }
          break;
        }

      default:
        log('Unhandled event type', { type: event.type });
    }
    } catch (err) {
    errorMessage = (err as Error).message;
    log('Error processing event', { 
      error: errorMessage,
      stack: (err as Error).stack 
    });
  }

  // Mark event as processed
  try {
    await supabase.rpc('mark_event_processed', {
      p_stripe_event_id: event.id,
      p_error_message: errorMessage
    });
  } catch (err) {
    log("Failed to mark event as processed (function may not exist)", { error: (err as Error).message });
  }

  if (errorMessage) {
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed', 
      details: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(JSON.stringify({ 
    received: true, 
    eventId: event.id,
    eventType: event.type 
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});

export const verifyJWT = false;