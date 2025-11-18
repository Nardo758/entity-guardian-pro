import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Updating payment method...');

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { setupIntentId } = await req.json();
    if (!setupIntentId) {
      throw new Error('setupIntentId is required');
    }

    console.log('User authenticated:', user.id);
    console.log('Setup Intent ID:', setupIntentId);

    // Retrieve the SetupIntent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      throw new Error(`SetupIntent is not in succeeded state: ${setupIntent.status}`);
    }

    const paymentMethodId = setupIntent.payment_method as string;
    if (!paymentMethodId) {
      throw new Error('No payment method attached to SetupIntent');
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    console.log('Payment method retrieved:', paymentMethodId);

    // Get user's Stripe customer ID
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscriber?.stripe_customer_id) {
      throw new Error('Stripe customer not found');
    }

    // Attach payment method to customer if not already attached
    if (paymentMethod.customer !== subscriber.stripe_customer_id) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: subscriber.stripe_customer_id,
      });
      console.log('Payment method attached to customer');
    }

    // Check if this should be the default (if it's the only payment method)
    const { data: existingMethods } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('user_id', user.id);

    const isFirstMethod = !existingMethods || existingMethods.length === 0;

    // Store payment method in database
    const { error: insertError } = await supabase
      .from('payment_methods')
      .insert({
        user_id: user.id,
        stripe_payment_method_id: paymentMethodId,
        type: paymentMethod.type,
        card_brand: paymentMethod.card?.brand,
        card_last4: paymentMethod.card?.last4,
        card_exp_month: paymentMethod.card?.exp_month,
        card_exp_year: paymentMethod.card?.exp_year,
        setup_intent_id: setupIntentId,
        setup_intent_status: setupIntent.status,
        is_default: isFirstMethod,
      });

    if (insertError) {
      console.error('Error inserting payment method:', insertError);
      throw insertError;
    }

    // If this is the first payment method, set it as default in Stripe
    if (isFirstMethod) {
      await stripe.customers.update(subscriber.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      console.log('Set as default payment method in Stripe');
    }

    console.log('Payment method saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        paymentMethodId,
        isDefault: isFirstMethod,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error updating payment method:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to update payment method',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
