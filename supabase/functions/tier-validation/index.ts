import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TIER-VALIDATION] ${step}${detailsStr}`);
};

// Define tier limits and features
const TIER_LIMITS = {
  starter: {
    entities: 4,
    features: ['email_notifications', 'basic_support', 'standard_templates']
  },
  growth: {
    entities: 20,
    features: ['email_notifications', 'sms_notifications', 'advanced_scheduling', 'live_chat', 'api_access', 'custom_reports', 'bulk_operations']
  },
  professional: {
    entities: 50,
    features: ['email_notifications', 'sms_notifications', 'advanced_scheduling', 'live_chat', 'phone_support', 'api_access', 'custom_reports', 'bulk_operations', 'advanced_analytics', 'webhooks', 'international_entities', 'custom_templates']
  },
  enterprise: {
    entities: 150,
    features: ['email_notifications', 'sms_notifications', 'advanced_scheduling', 'live_chat', 'phone_support', 'api_access', 'custom_reports', 'bulk_operations', 'advanced_analytics', 'webhooks', 'international_entities', 'custom_templates', 'white_label', 'unlimited_users', 'custom_integrations', 'dedicated_manager']
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Tier validation request started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('Authentication failed');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { feature, action } = await req.json();
    logStep("Validation request", { feature, action, userId: user.id });

    // Get user's subscription
      const { data: subscription, error: subError } = await supabaseClient
        .from('subscriptions')
        .select('plan_id, subscribed')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      logStep("Subscription lookup failed", subError);
      throw new Error('Failed to get subscription information');
    }

      const tier = subscription?.plan_id || 'starter';
    const isSubscribed = subscription?.subscribed || false;
    
    logStep("User subscription info", { tier, isSubscribed });

    // Validate entity limits
    if (action === 'create_entity') {
      const { data: entities, error: entityError } = await supabaseClient
        .from('entities')
        .select('id')
        .eq('user_id', user.id);

      if (entityError) {
        throw new Error('Failed to check entity count');
      }

      const currentCount = entities?.length || 0;
      const maxEntities = TIER_LIMITS[tier as keyof typeof TIER_LIMITS]?.entities || 4;

      logStep("Entity validation", { currentCount, maxEntities, tier });

      if (currentCount >= maxEntities) {
        return new Response(JSON.stringify({
          allowed: false,
          error: `Entity limit reached for ${tier} plan (${currentCount}/${maxEntities})`,
          currentTier: tier,
          requiredTier: getNextTier(tier),
          feature: 'Entity Creation'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        });
      }

      return new Response(JSON.stringify({
        allowed: true,
        currentCount,
        maxEntities,
        tier
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Validate feature access
    if (feature) {
      const tierData = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
      const hasFeature = tierData?.features.includes(feature);

      logStep("Feature validation", { feature, tier, hasFeature });

      if (!hasFeature) {
        const requiredTier = getMinimumTierForFeature(feature);
        
        return new Response(JSON.stringify({
          allowed: false,
          error: `${feature} requires ${requiredTier} plan or higher`,
          currentTier: tier,
          requiredTier,
          feature
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        });
      }

      return new Response(JSON.stringify({
        allowed: true,
        tier,
        feature
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // If no specific validation requested, return tier info
    return new Response(JSON.stringify({
      tier,
      isSubscribed,
      limits: TIER_LIMITS[tier as keyof typeof TIER_LIMITS]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    logStep("ERROR in tier validation", { error: error.message });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      allowed: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

function getNextTier(currentTier: string): string {
  const tierOrder = ['starter', 'growth', 'professional', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  return tierOrder[currentIndex + 1] || 'enterprise';
}

function getMinimumTierForFeature(feature: string): string {
  const featureTierMap: Record<string, string> = {
    'sms_notifications': 'growth',
    'advanced_scheduling': 'growth',
    'live_chat': 'growth',
    'api_access': 'growth',
    'custom_reports': 'growth',
    'bulk_operations': 'growth',
    'phone_support': 'professional',
    'advanced_analytics': 'professional',
    'webhooks': 'professional',
    'international_entities': 'professional',
    'custom_templates': 'professional',
    'white_label': 'enterprise',
    'unlimited_users': 'enterprise',
    'custom_integrations': 'enterprise',
    'dedicated_manager': 'enterprise'
  };
  
  return featureTierMap[feature] || 'growth';
}