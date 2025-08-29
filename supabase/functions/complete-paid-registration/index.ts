import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Type definitions
interface PaymentMetadata {
  email: string;
  registration: string;
  first_name: string;
  last_name: string;
  company: string;
  company_size: string;
  tier: string;
  billing: 'monthly' | 'yearly';
}

interface PaymentRequest {
  paymentIntentId: string;
}

interface PaymentResponse {
  success: boolean;
  userId: string;
  email: string;
  subscriptionTier: string;
  signInUrl?: string;
}

interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

interface SubscriptionRecord {
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string;
  updated_at: string;
  payment_intent_id?: string;
}

interface LogDetails {
  paymentIntentId?: string;
  userId?: string;
  email?: string;
  status?: string;
  amount?: number;
  tier?: string;
  error?: Error | Record<string, unknown>;
  message?: string;
  requestId?: string;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced logging with structured format
const logStep = (step: string, details?: LogDetails, level: 'info' | 'warn' | 'error' = 'info') => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    service: 'COMPLETE-PAID-REGISTRATION',
    level: level.toUpperCase(),
    step,
    ...details
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
};

// Custom error classes for better error handling
class PaymentError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 400) {
    super(message);
    this.name = 'PaymentError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Rate limiting function
const checkRateLimit = (identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
};

// Input validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

const validatePaymentMetadata = (metadata: Record<string, unknown>): PaymentMetadata => {
  if (!metadata.email || typeof metadata.email !== 'string' || !validateEmail(metadata.email)) {
    throw new ValidationError('Invalid email address', 'email');
  }
  
  if (!metadata.registration || typeof metadata.registration !== 'string') {
    throw new ValidationError('Registration data is required', 'registration');
  }
  
  if (!metadata.first_name || typeof metadata.first_name !== 'string' || metadata.first_name.length < 1) {
    throw new ValidationError('First name is required', 'first_name');
  }
  
  if (!metadata.last_name || typeof metadata.last_name !== 'string' || metadata.last_name.length < 1) {
    throw new ValidationError('Last name is required', 'last_name');
  }
  
  if (!metadata.tier || typeof metadata.tier !== 'string' || !['basic', 'pro', 'enterprise'].includes(metadata.tier.toLowerCase())) {
    throw new ValidationError('Invalid subscription tier', 'tier');
  }
  
  if (!metadata.billing || typeof metadata.billing !== 'string' || !['monthly', 'yearly'].includes(metadata.billing)) {
    throw new ValidationError('Invalid billing period', 'billing');
  }
  
  return {
    email: sanitizeString(metadata.email.toLowerCase()),
    registration: metadata.registration,
    first_name: sanitizeString(metadata.first_name),
    last_name: sanitizeString(metadata.last_name),
    company: sanitizeString((metadata.company as string) || ''),
    company_size: sanitizeString((metadata.company_size as string) || ''),
    tier: metadata.tier.toLowerCase(),
    billing: metadata.billing as 'monthly' | 'yearly'
  };
};

// Secure user lookup to prevent enumeration attacks
const findUserSecurely = async (supabaseAdmin: SupabaseClient, email: string) => {
  try {
    // Use RPC or direct query instead of listing all users
    const { data, error } = await supabaseAdmin.rpc('find_user_by_email', { user_email: email });
    
    if (error) {
      logStep('RPC user lookup failed, using fallback', { error: error.message }, 'warn');
      // Fallback to admin.listUsers with filter (less secure but functional)
      try {
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          logStep('Fallback user lookup failed', { error: listError }, 'error');
          return null;
        }
        return users.users.find(user => user.email === email) || null;
      } catch (fallbackError) {
        logStep('Fallback user lookup exception', { error: fallbackError }, 'error');
        return null;
      }
    }
    
    // The RPC returns a JSON object, so we need to parse it if it's valid
    return data;
  } catch (error) {
    logStep('User lookup error', { error }, 'warn');
    return null;
  }
};

// Generate a secure random password
const generateSecurePassword = (): string => {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};

serve(async (req) => {
  // Generate request ID for tracking
  const requestId = crypto.randomUUID();
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  if (!checkRateLimit(clientIP, 5, 60000)) { // 5 requests per minute per IP
    logStep("Rate limit exceeded", { clientIP, requestId }, 'warn');
    return new Response(JSON.stringify({ 
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED"
    } as ErrorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 429,
    });
  }

  // Use service role for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started", { requestId, clientIP });

    // Parse and validate request body
    let requestBody: PaymentRequest;
    try {
      requestBody = await req.json();
    } catch (error) {
      throw new ValidationError("Invalid JSON in request body");
    }

    const { paymentIntentId } = requestBody;

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
      throw new ValidationError("Payment intent ID is required and must be a string");
    }

    if (paymentIntentId.length < 10 || !paymentIntentId.startsWith('pi_')) {
      throw new ValidationError("Invalid payment intent ID format");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve and verify payment intent
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logStep("Stripe API error", { error, paymentIntentId, requestId }, 'error');
      throw new PaymentError("Invalid payment intent ID", "PAYMENT_NOT_FOUND", 404);
    }
    
    if (paymentIntent.status !== 'succeeded') {
      throw new PaymentError(
        `Payment not completed successfully. Status: ${paymentIntent.status}`,
        "PAYMENT_NOT_COMPLETED",
        400
      );
    }

    logStep("Payment verified", { 
      paymentIntentId, 
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      requestId
    });

    // Validate and sanitize payment metadata
    const validatedMetadata = validatePaymentMetadata(paymentIntent.metadata);

    // Check for duplicate processing
    const existingSubscriber = await supabaseAdmin
      .from("subscribers")
      .select("*")
      .eq("email", validatedMetadata.email)
      .single();

    if (existingSubscriber.data?.payment_intent_id === paymentIntentId) {
      logStep("Duplicate payment processing attempt", { 
        paymentIntentId, 
        email: validatedMetadata.email,
        requestId 
      }, 'warn');
      
      return new Response(JSON.stringify({
        success: true,
        userId: existingSubscriber.data.user_id,
        email: validatedMetadata.email,
        subscriptionTier: existingSubscriber.data.subscription_tier || validatedMetadata.tier,
        message: "Payment already processed"
      } as PaymentResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Secure user lookup
    const existingUser = await findUserSecurely(supabaseAdmin, validatedMetadata.email);
    
    let authData: { user: { id: string; email?: string; user_metadata?: Record<string, unknown> } };
    
    // Database transaction simulation (Supabase doesn't support full transactions in Edge Functions)
    // We'll implement compensating actions on failure
    const rollbackActions: (() => Promise<void>)[] = [];

    try {
      if (existingUser) {
        logStep("Existing user found", { 
          userId: existingUser.id, 
          email: validatedMetadata.email,
          requestId 
        });
        
        // Update existing user's metadata
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              ...existingUser.user_metadata,
              first_name: validatedMetadata.first_name,
              last_name: validatedMetadata.last_name,
              company: validatedMetadata.company,
              company_size: validatedMetadata.company_size,
              paid_registration: true,
              payment_intent_id: paymentIntentId,
              updated_at: new Date().toISOString(),
            },
          }
        );
        
        if (updateError) {
          logStep("User update error", { error: updateError, requestId }, 'error');
          throw new PaymentError(`Failed to update user account: ${updateError.message}`, "USER_UPDATE_FAILED");
        }
        
        authData = { user: updatedUser.user };
        logStep("User updated", { userId: existingUser.id, email: validatedMetadata.email, requestId });
      } else {
        // Create new user account
        const securePassword = generateSecurePassword();
        const { data: newAuthData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: validatedMetadata.email,
          password: securePassword,
          email_confirm: true, // Auto-confirm email for paid users
          user_metadata: {
            first_name: validatedMetadata.first_name,
            last_name: validatedMetadata.last_name,
            company: validatedMetadata.company,
            company_size: validatedMetadata.company_size,
            paid_registration: true,
            payment_intent_id: paymentIntentId,
            created_at: new Date().toISOString(),
          },
        });

        if (authError) {
          logStep("Auth error", { error: authError, requestId }, 'error');
          throw new PaymentError(`Failed to create user account: ${authError.message}`, "USER_CREATION_FAILED");
        }

        authData = newAuthData;
        
        // Add rollback action to delete user if subscription creation fails
        rollbackActions.push(async () => {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        });
        
        logStep("User created", { userId: authData.user.id, email: validatedMetadata.email, requestId });
      }

      // Calculate subscription end date (add 30 days for monthly, 365 days for yearly)
      const subscriptionEnd = new Date();
      if (validatedMetadata.billing === 'yearly') {
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 365);
      } else {
        subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);
      }

      const subscriptionRecord: SubscriptionRecord = {
        user_id: authData.user.id,
        email: validatedMetadata.email,
        stripe_customer_id: paymentIntent.customer as string,
        subscribed: true,
        subscription_tier: validatedMetadata.tier.charAt(0).toUpperCase() + validatedMetadata.tier.slice(1),
        subscription_end: subscriptionEnd.toISOString(),
        updated_at: new Date().toISOString(),
        payment_intent_id: paymentIntentId,
      };

      // Upsert subscription record
      const { error: subscriptionError } = await supabaseAdmin
        .from("subscribers")
        .upsert(subscriptionRecord, { onConflict: 'email' });

      if (subscriptionError) {
        logStep("Subscription creation error", { error: subscriptionError, requestId }, 'error');
        throw new PaymentError(`Failed to create subscription: ${subscriptionError.message}`, "SUBSCRIPTION_CREATION_FAILED");
      }

      logStep("Subscriber record created", { 
        userId: authData.user.id, 
        tier: validatedMetadata.tier,
        requestId 
      });

      // Generate sign-in link for immediate access
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: validatedMetadata.email,
      });

      if (signInError) {
        logStep("Warning: Could not generate sign-in link", { error: signInError, requestId }, 'warn');
      }

      const response: PaymentResponse = {
        success: true,
        userId: authData.user.id,
        email: validatedMetadata.email,
        subscriptionTier: validatedMetadata.tier,
        signInUrl: signInData?.properties?.action_link,
      };

      logStep("Payment processing completed successfully", { 
        userId: authData.user.id,
        tier: validatedMetadata.tier,
        requestId 
      });

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (error) {
      // Execute rollback actions
      for (const rollback of rollbackActions) {
        try {
          await rollback();
        } catch (rollbackError) {
          logStep("Rollback action failed", { error: rollbackError, requestId }, 'error');
        }
      }
      throw error;
    }

  } catch (error) {
    let errorResponse: ErrorResponse;
    let statusCode = 500;

    if (error instanceof ValidationError) {
      errorResponse = {
        error: error.message,
        code: "VALIDATION_ERROR",
        details: error.field ? { field: error.field } : undefined
      };
      statusCode = 400;
    } else if (error instanceof PaymentError) {
      errorResponse = {
        error: error.message,
        code: error.code
      };
      statusCode = error.statusCode;
    } else if (error instanceof RateLimitError) {
      errorResponse = {
        error: error.message,
        code: "RATE_LIMIT_EXCEEDED"
      };
      statusCode = 429;
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errorResponse = {
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR"
      };
      
      logStep("Unexpected error in complete-paid-registration", { 
        message: errorMessage, 
        stack: error instanceof Error ? error.stack : undefined,
        requestId 
      }, 'error');
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});