import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-PAID-REGISTRATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      throw new Error("Payment intent ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve and verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error("Payment not completed successfully");
    }

    logStep("Payment verified", { 
      paymentIntentId, 
      status: paymentIntent.status,
      amount: paymentIntent.amount 
    });

    const metadata = paymentIntent.metadata;
    if (!metadata.email || !metadata.registration) {
      throw new Error("Invalid payment metadata");
    }

    // Ensure a user exists and get a magic link. This works for existing or new users.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: metadata.email,
    });
    if (linkError) {
      logStep("Auth generateLink error", linkError);
      throw new Error(`Failed to generate sign-in link: ${linkError.message}`);
    }

    const userId = linkData.user?.id;
    if (userId) {
      // Best-effort: update user metadata
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            company: metadata.company,
            company_size: metadata.company_size,
            paid_registration: true,
            payment_intent_id: paymentIntentId,
          },
        });
      } catch (e) {
        logStep("Warning: could not update user metadata", { message: (e as Error).message });
      }
    }
    logStep("User ensured", { userId: userId || null, email: metadata.email });

    // Create subscription record
    const subscriptionTier = metadata.tier;
    const billing = metadata.billing;
    
    // Calculate subscription end date
    const subscriptionEnd = new Date();
    if (billing === 'yearly') {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    } else {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    }

    await supabaseAdmin.from("subscribers").upsert({
      user_id: userId || null,
      email: metadata.email,
      stripe_customer_id: paymentIntent.customer as any,
      subscribed: true,
      subscription_tier: subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1),
      subscription_end: subscriptionEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Subscriber record created", { userId: authData.user.id, tier: subscriptionTier });

    return new Response(JSON.stringify({
      success: true,
      userId: userId || null,
      email: metadata.email,
      subscriptionTier,
      signInUrl: linkData?.properties?.action_link,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in complete-paid-registration", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});