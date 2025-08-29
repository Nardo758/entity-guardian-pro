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

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(user => user.email === metadata.email);
    
    let authData;
    if (existingUser) {
      logStep("Existing user found", { userId: existingUser.id, email: metadata.email });
      
      // Update existing user's metadata
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            ...existingUser.user_metadata,
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            company: metadata.company,
            company_size: metadata.company_size,
            paid_registration: true,
            payment_intent_id: paymentIntentId,
          },
        }
      );
      
      if (updateError) {
        logStep("User update error", updateError);
        throw new Error(`Failed to update user account: ${updateError.message}`);
      }
      
      authData = { user: updatedUser.user };
      logStep("User updated", { userId: existingUser.id, email: metadata.email });
    } else {
      // Create new user account
      const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: metadata.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        email_confirm: true, // Auto-confirm email for paid users
        user_metadata: {
          first_name: metadata.first_name,
          last_name: metadata.last_name,
          company: metadata.company,
          company_size: metadata.company_size,
          paid_registration: true,
          payment_intent_id: paymentIntentId,
        },
      });

      if (authError) {
        logStep("Auth error", authError);
        throw new Error(`Failed to create user account: ${authError.message}`);
      }

      authData = newAuthData;
      logStep("User created", { userId: authData.user.id, email: metadata.email });
    }

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

    // Upsert subscription record (insert or update if exists)
    await supabaseAdmin.from("subscribers").upsert({
      user_id: authData.user.id,
      email: metadata.email,
      stripe_customer_id: paymentIntent.customer,
      subscribed: true,
      subscription_tier: subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1),
      subscription_end: subscriptionEnd.toISOString(),
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'email' 
    });

    logStep("Subscriber record created", { userId: authData.user.id, tier: subscriptionTier });

    // Generate sign-in link for immediate access
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: metadata.email,
    });

    if (signInError) {
      logStep("Warning: Could not generate sign-in link", signInError);
    }

    return new Response(JSON.stringify({
      success: true,
      userId: authData.user.id,
      email: metadata.email,
      subscriptionTier,
      signInUrl: signInData?.properties?.action_link,
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