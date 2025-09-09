import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, ArrowUp } from 'lucide-react';
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { useNavigate } from 'react-router-dom';
import { STRIPE_PRICING_TIERS } from '@/lib/stripe';

interface FeatureGateProps {
  feature: keyof Omit<ReturnType<typeof useTierPermissions>, 'currentTier' | 'tierData' | 'maxEntities'>;
  requiredTier?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  requiredTier, 
  fallback, 
  children, 
  showUpgrade = true 
}) => {
  const permissions = useTierPermissions();
  const navigate = useNavigate();
  
  // Check if the feature is allowed
  const isAllowed = permissions[feature];
  
  if (isAllowed) {
    return <>{children}</>;
  }
  
  // If no custom fallback provided, show upgrade prompt
  if (!fallback && showUpgrade) {
    const targetTier = requiredTier || getMinimumTierForFeature(feature);
    const targetTierData = STRIPE_PRICING_TIERS[targetTier as keyof typeof STRIPE_PRICING_TIERS];
    
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Premium Feature</h3>
              <p className="text-sm text-muted-foreground">
                This feature requires the <strong>{targetTierData?.name}</strong> plan or higher.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="outline" className="text-muted-foreground">
                  Current: {permissions.tierData.name}
                </Badge>
                <ArrowUp className="h-3 w-3 text-muted-foreground" />
                <Badge className="bg-primary text-primary-foreground">
                  Upgrade to {targetTierData?.name}
                </Badge>
              </div>
            </div>
            <Button onClick={() => navigate('/billing?tab=plans')} className="gap-2">
              <Zap className="h-4 w-4" />
              Upgrade Plan - ${targetTierData?.monthlyPrice}/month
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <>{fallback}</>;
};

// Component for inline feature restrictions
export const FeatureBadge: React.FC<{ feature: string; requiredTier: string }> = ({ 
  feature, 
  requiredTier 
}) => {
  const permissions = useTierPermissions();
  const tierData = STRIPE_PRICING_TIERS[requiredTier as keyof typeof STRIPE_PRICING_TIERS];
  
  const needsUpgrade = permissions.currentTier !== requiredTier;
  
  if (!needsUpgrade) return null;
  
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Lock className="h-3 w-3" />
      {tierData?.name} Required
    </Badge>
  );
};

// Helper function to determine minimum tier for features
function getMinimumTierForFeature(feature: string): string {
  const featureTierMap: Record<string, string> = {
    canUseSMS: 'growth',
    canAdvancedScheduling: 'growth',
    canLiveChat: 'growth',
    canCustomReports: 'growth',
    canBulkOperations: 'growth',
    hasAPIAccess: 'growth',
    canPhoneSupport: 'professional',
    canAdvancedAnalytics: 'professional',
    canCustomTemplates: 'professional',
    canWebhooks: 'professional',
    canInternationalEntities: 'professional',
    canWhiteLabel: 'enterprise',
    hasUnlimitedUsers: 'enterprise',
    canCustomIntegrations: 'enterprise',
  };
  
  return featureTierMap[feature] || 'growth';
}