import { useState, useEffect } from 'react';
import { useSubscription } from './useSubscription';
import { useEntities } from './useEntities';
import { STRIPE_PRICING_TIERS } from '@/lib/stripe';
import { toast } from 'sonner';

interface EntityLimitInfo {
  currentEntities: number;
  maxEntities: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  percentageUsed: number;
  canAddMore: boolean;
  upgradeRequired: boolean;
  nextTier?: string;
  nextTierPrice?: number;
}

export const useEntityLimits = () => {
  const { subscription } = useSubscription();
  const { entities } = useEntities();
  const [limitInfo, setLimitInfo] = useState<EntityLimitInfo>({
    currentEntities: 0,
    maxEntities: 4, // Default to starter tier
    isNearLimit: false,
    isAtLimit: false,
    percentageUsed: 0,
    canAddMore: true,
    upgradeRequired: false,
  });

    useEffect(() => {
      const currentTier = subscription.plan_id || 'starter';
    const tierData = STRIPE_PRICING_TIERS[currentTier as keyof typeof STRIPE_PRICING_TIERS];
    
    if (!tierData) {
      console.warn(`Unknown subscription tier: ${currentTier}`);
      return;
    }

    const currentEntities = entities.length;
    const maxEntities = typeof tierData.entities === 'number' ? tierData.entities : 999;
    const percentageUsed = (currentEntities / maxEntities) * 100;
    const isNearLimit = percentageUsed >= 80; // 80% threshold
    const isAtLimit = currentEntities >= maxEntities;
    const canAddMore = currentEntities < maxEntities;

    // Find next tier for upgrade suggestions
      const tiers = Object.values(STRIPE_PRICING_TIERS);
      const currentTierIndex = tiers.findIndex(tier => tier.id === currentTier);
    const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : undefined;

    setLimitInfo({
      currentEntities,
      maxEntities,
      isNearLimit,
      isAtLimit,
      percentageUsed,
      canAddMore,
      upgradeRequired: isAtLimit,
      nextTier: nextTier?.id,
      nextTierPrice: nextTier?.monthlyPrice,
    });

    // Show warnings
    if (isAtLimit) {
      toast.error(
        `Entity limit reached! You have ${currentEntities}/${maxEntities} entities. Upgrade to add more.`,
        {
          duration: 5000,
          action: {
            label: 'Upgrade',
            onClick: () => {
              // Navigate to billing/upgrade
              window.location.href = '/billing?tab=plans';
            },
          },
        }
      );
    } else if (isNearLimit && !isAtLimit) {
      toast.warning(
        `You're using ${currentEntities}/${maxEntities} entities (${percentageUsed.toFixed(0)}%). Consider upgrading soon.`,
        {
          duration: 4000,
        }
      );
    }
  }, [subscription, entities]);

  const checkCanAddEntity = (): boolean => {
    if (!limitInfo.canAddMore) {
        toast.error(
          `Cannot add more entities. You've reached the limit of ${limitInfo.maxEntities} entities for your ${subscription.plan_id || 'starter'} plan.`,
        {
          action: {
            label: 'Upgrade Plan',
            onClick: () => {
              window.location.href = '/billing?tab=plans';
            },
          },
        }
      );
      return false;
    }
    return true;
  };

  const getUpgradeMessage = (): string => {
    if (limitInfo.nextTier && limitInfo.nextTierPrice) {
      const nextTierData = STRIPE_PRICING_TIERS[limitInfo.nextTier as keyof typeof STRIPE_PRICING_TIERS];
      return `Upgrade to ${nextTierData.name} for $${limitInfo.nextTierPrice}/month to manage up to ${nextTierData.entities} entities.`;
    }
    return 'Upgrade your plan to manage more entities.';
  };

  return {
    ...limitInfo,
    checkCanAddEntity,
    getUpgradeMessage,
  };
};