import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, X, CheckCircle } from 'lucide-react';
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { useNavigate } from 'react-router-dom';
import { STRIPE_PRICING_TIERS } from '@/lib/stripe';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: string;
  featureName: string;
  featureDescription?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  requiredTier,
  featureName,
  featureDescription
}) => {
  const permissions = useTierPermissions();
  const navigate = useNavigate();
  
  const targetTierData = STRIPE_PRICING_TIERS[requiredTier as keyof typeof STRIPE_PRICING_TIERS];
  const currentTierData = permissions.tierData;
  
  const handleUpgrade = () => {
    onClose();
    navigate('/billing?tab=plans&highlight=' + requiredTier);
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <AlertDialogTitle>Upgrade Required</AlertDialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              <strong>{featureName}</strong> requires the <strong>{targetTierData?.name}</strong> plan.
            </p>
            {featureDescription && (
              <p className="text-sm text-muted-foreground">
                {featureDescription}
              </p>
            )}
            
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Current Plan:</span>
                <Badge variant="outline">{currentTierData.name}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Required Plan:</span>
                <Badge className="bg-primary text-primary-foreground">
                  {targetTierData?.name}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">What you'll get with {targetTierData?.name}:</h4>
              <div className="space-y-1">
                {targetTierData?.features.slice(0, 3).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} className="gap-2">
            <Zap className="h-4 w-4" />
            Upgrade to {targetTierData?.name} - ${targetTierData?.monthlyPrice}/mo
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Hook for managing upgrade prompts
export const useUpgradePrompt = () => {
  const [promptState, setPromptState] = React.useState<{
    isOpen: boolean;
    requiredTier: string;
    featureName: string;
    featureDescription?: string;
  }>({
    isOpen: false,
    requiredTier: '',
    featureName: '',
    featureDescription: undefined,
  });
  
  const showUpgradePrompt = (
    featureName: string, 
    requiredTier: string, 
    featureDescription?: string
  ) => {
    setPromptState({
      isOpen: true,
      requiredTier,
      featureName,
      featureDescription,
    });
  };
  
  const closePrompt = () => {
    setPromptState(prev => ({ ...prev, isOpen: false }));
  };
  
  return {
    promptState,
    showUpgradePrompt,
    closePrompt,
    UpgradePromptComponent: () => (
      <UpgradePrompt
        isOpen={promptState.isOpen}
        onClose={closePrompt}
        requiredTier={promptState.requiredTier}
        featureName={promptState.featureName}
        featureDescription={promptState.featureDescription}
      />
    ),
  };
};