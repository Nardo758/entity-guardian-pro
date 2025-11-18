// Server-side validation functions for tier restrictions

import { supabase } from '@/integrations/supabase/client';

interface ValidationResponse {
  allowed: boolean;
  error?: string;
  requiredTier?: string;
}

// Validate entity creation against tier limits
export const validateEntityCreation = async (userId: string): Promise<ValidationResponse> => {
  try {
    // Get user's subscription tier
    const { data: subscription } = await supabase.functions.invoke('check-subscription');
    
    if (!subscription) {
      return { allowed: false, error: 'Subscription not found', requiredTier: 'starter' };
    }

    // Get current entity count
    const { data: entities, error } = await supabase
      .from('entities')
      .select('id')
      .eq('user_id', userId);

    if (error) {
      return { allowed: false, error: 'Failed to check entity count' };
    }

    const currentCount = entities?.length || 0;
      const tier = subscription.plan_id || 'starter';
    
    // Define tier limits (must match frontend)
    const tierLimits: Record<string, number> = {
      starter: 4,
      growth: 20,
      professional: 50,
      enterprise: 150
    };

    const maxEntities = tierLimits[tier] || 4;
    
    if (currentCount >= maxEntities) {
      // Find next tier
      const nextTier = getNextTier(tier);
      return {
        allowed: false,
        error: `Entity limit reached for ${tier} plan (${currentCount}/${maxEntities})`,
        requiredTier: nextTier
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Entity validation error:', error);
    return { allowed: false, error: 'Validation failed' };
  }
};

// Validate API access
export const validateAPIAccess = async (userId: string): Promise<ValidationResponse> => {
  try {
    const { data: subscription } = await supabase.functions.invoke('check-subscription');
      const tier = subscription?.plan_id || 'starter';
    
    // API access only available for Growth and above
    const allowedTiers = ['growth', 'professional', 'enterprise'];
    
    if (!allowedTiers.includes(tier)) {
      return {
        allowed: false,
        error: 'API access requires Growth plan or higher',
        requiredTier: 'growth'
      };
    }

    return { allowed: true };
  } catch (error) {
    return { allowed: false, error: 'API validation failed' };
  }
};

// Validate advanced analytics access
export const validateAdvancedAnalytics = async (userId: string): Promise<ValidationResponse> => {
  try {
    const { data: subscription } = await supabase.functions.invoke('check-subscription');
      const tier = subscription?.plan_id || 'starter';
    
    const allowedTiers = ['professional', 'enterprise'];
    
    if (!allowedTiers.includes(tier)) {
      return {
        allowed: false,
        error: 'Advanced analytics requires Professional plan or higher',
        requiredTier: 'professional'
      };
    }

    return { allowed: true };
  } catch (error) {
    return { allowed: false, error: 'Analytics validation failed' };
  }
};

// Validate bulk operations
export const validateBulkOperations = async (userId: string): Promise<ValidationResponse> => {
  try {
    const { data: subscription } = await supabase.functions.invoke('check-subscription');
      const tier = subscription?.plan_id || 'starter';
    
    const allowedTiers = ['growth', 'professional', 'enterprise'];
    
    if (!allowedTiers.includes(tier)) {
      return {
        allowed: false,
        error: 'Bulk operations require Growth plan or higher',
        requiredTier: 'growth'
      };
    }

    return { allowed: true };
  } catch (error) {
    return { allowed: false, error: 'Bulk operations validation failed' };
  }
};

// Validate custom reports access
export const validateCustomReports = async (userId: string): Promise<ValidationResponse> => {
  try {
    const { data: subscription } = await supabase.functions.invoke('check-subscription');
      const tier = subscription?.plan_id || 'starter';
    
    const allowedTiers = ['growth', 'professional', 'enterprise'];
    
    if (!allowedTiers.includes(tier)) {
      return {
        allowed: false,
        error: 'Custom reports require Growth plan or higher',
        requiredTier: 'growth'
      };
    }

    return { allowed: true };
  } catch (error) {
    return { allowed: false, error: 'Custom reports validation failed' };
  }
};

// Helper function to get next tier
function getNextTier(currentTier: string): string {
  const tierOrder = ['starter', 'growth', 'professional', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  return tierOrder[currentIndex + 1] || 'enterprise';
}

// Generic validation function for features
export const validateFeatureAccess = async (
  userId: string,
  feature: string
): Promise<ValidationResponse> => {
  const validators: Record<string, typeof validateEntityCreation> = {
    entity_creation: validateEntityCreation,
    api_access: validateAPIAccess,
    advanced_analytics: validateAdvancedAnalytics,
    bulk_operations: validateBulkOperations,
    custom_reports: validateCustomReports,
  };

  const validator = validators[feature];
  if (!validator) {
    return { allowed: false, error: 'Unknown feature' };
  }

  return validator(userId);
};