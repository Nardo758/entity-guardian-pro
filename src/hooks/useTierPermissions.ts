import { useSubscription } from './useSubscription';
import { useEntityLimits } from './useEntityLimits';
import { STRIPE_PRICING_TIERS } from '@/lib/stripe';

interface TierPermissions {
  // Entity Management
  maxEntities: number;
  canAddEntity: boolean;
  canBulkOperations: boolean;
  
  // Notifications
  canUseSMS: boolean;
  canAdvancedScheduling: boolean;
  
  // Support
  canLiveChat: boolean;
  canPhoneSupport: boolean;
  supportPriority: 'standard' | 'priority' | 'dedicated';
  
  // Templates & Reports
  canCustomTemplates: boolean;
  canCustomReports: boolean;
  canAdvancedAnalytics: boolean;
  
  // API Access
  hasAPIAccess: boolean;
  apiRateLimit: number;
  canWebhooks: boolean;
  
  // Advanced Features
  canInternationalEntities: boolean;
  canWhiteLabel: boolean;
  hasUnlimitedUsers: boolean;
  canCustomIntegrations: boolean;
  
  // Current tier info
  currentTier: string;
  tierData: any;
}

export const useTierPermissions = (): TierPermissions => {
  const { subscription } = useSubscription();
  const { canAddMore: canAddEntity } = useEntityLimits();
  
  const currentTier = subscription.subscription_tier || 'starter';
  const tierData = STRIPE_PRICING_TIERS[currentTier as keyof typeof STRIPE_PRICING_TIERS] || STRIPE_PRICING_TIERS.starter;
  
  // Base permissions for all tiers
  const basePermissions = {
    maxEntities: tierData.entities,
    canAddEntity,
    currentTier,
    tierData,
  };
  
  // Tier-specific permissions
  switch (currentTier) {
    case 'starter':
      return {
        ...basePermissions,
        canBulkOperations: false,
        canUseSMS: false,
        canAdvancedScheduling: false,
        canLiveChat: false,
        canPhoneSupport: false,
        supportPriority: 'standard',
        canCustomTemplates: false,
        canCustomReports: false,
        canAdvancedAnalytics: false,
        hasAPIAccess: false,
        apiRateLimit: 0,
        canWebhooks: false,
        canInternationalEntities: false,
        canWhiteLabel: false,
        hasUnlimitedUsers: false,
        canCustomIntegrations: false,
      };
      
    case 'growth':
      return {
        ...basePermissions,
        canBulkOperations: true,
        canUseSMS: true,
        canAdvancedScheduling: true,
        canLiveChat: true,
        canPhoneSupport: false,
        supportPriority: 'standard',
        canCustomTemplates: false,
        canCustomReports: true,
        canAdvancedAnalytics: false,
        hasAPIAccess: true,
        apiRateLimit: 1000,
        canWebhooks: false,
        canInternationalEntities: false,
        canWhiteLabel: false,
        hasUnlimitedUsers: false,
        canCustomIntegrations: false,
      };
      
    case 'professional':
      return {
        ...basePermissions,
        canBulkOperations: true,
        canUseSMS: true,
        canAdvancedScheduling: true,
        canLiveChat: true,
        canPhoneSupport: true,
        supportPriority: 'priority',
        canCustomTemplates: true,
        canCustomReports: true,
        canAdvancedAnalytics: true,
        hasAPIAccess: true,
        apiRateLimit: 5000,
        canWebhooks: true,
        canInternationalEntities: true,
        canWhiteLabel: false,
        hasUnlimitedUsers: false,
        canCustomIntegrations: false,
      };
      
    case 'enterprise':
      return {
        ...basePermissions,
        canBulkOperations: true,
        canUseSMS: true,
        canAdvancedScheduling: true,
        canLiveChat: true,
        canPhoneSupport: true,
        supportPriority: 'dedicated',
        canCustomTemplates: true,
        canCustomReports: true,
        canAdvancedAnalytics: true,
        hasAPIAccess: true,
        apiRateLimit: -1, // Unlimited
        canWebhooks: true,
        canInternationalEntities: true,
        canWhiteLabel: true,
        hasUnlimitedUsers: true,
        canCustomIntegrations: true,
      };
      
    default:
      return {
        ...basePermissions,
        canBulkOperations: false,
        canUseSMS: false,
        canAdvancedScheduling: false,
        canLiveChat: false,
        canPhoneSupport: false,
        supportPriority: 'standard',
        canCustomTemplates: false,
        canCustomReports: false,
        canAdvancedAnalytics: false,
        hasAPIAccess: false,
        apiRateLimit: 0,
        canWebhooks: false,
        canInternationalEntities: false,
        canWhiteLabel: false,
        hasUnlimitedUsers: false,
        canCustomIntegrations: false,
      };
  }
};

// Helper function to check if upgrade is needed
export const useUpgradeCheck = (requiredTier: string) => {
  const { subscription } = useSubscription();
  const currentTier = subscription.subscription_tier || 'starter';
  
  const tierOrder = ['starter', 'growth', 'professional', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const requiredIndex = tierOrder.indexOf(requiredTier);
  
  return {
    needsUpgrade: currentIndex < requiredIndex,
    currentTier,
    requiredTier,
  };
};