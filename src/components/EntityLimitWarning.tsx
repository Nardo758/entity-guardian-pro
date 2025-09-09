import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowUp, Crown } from 'lucide-react';
import { useEntityLimits } from '@/hooks/useEntityLimits';
import { useNavigate } from 'react-router-dom';

interface EntityLimitWarningProps {
  className?: string;
  showInDashboard?: boolean;
}

export const EntityLimitWarning: React.FC<EntityLimitWarningProps> = ({ 
  className = '',
  showInDashboard = false 
}) => {
  const navigate = useNavigate();
  const {
    currentEntities,
    maxEntities,
    isNearLimit,
    isAtLimit,
    percentageUsed,
    getUpgradeMessage,
    nextTier,
    nextTierPrice,
  } = useEntityLimits();

  if (!isNearLimit && !isAtLimit) {
    return null; // Don't show if not near or at limit
  }

  const handleUpgrade = () => {
    navigate('/billing?tab=plans');
  };

  if (showInDashboard) {
    return (
      <Card className={`border-l-4 ${isAtLimit ? 'border-l-destructive' : 'border-l-warning'} ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isAtLimit ? 'bg-destructive/10' : 'bg-warning/10'}`}>
              {isAtLimit ? (
                <AlertTriangle className={`h-4 w-4 ${isAtLimit ? 'text-destructive' : 'text-warning'}`} />
              ) : (
                <Crown className="h-4 w-4 text-warning" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">
                  {isAtLimit ? 'Entity Limit Reached' : 'Approaching Entity Limit'}
                </h4>
                <span className="text-sm font-medium">
                  {currentEntities}/{maxEntities}
                </span>
              </div>
              <Progress 
                value={percentageUsed} 
                className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : '[&>div]:bg-warning'}`}
              />
              <p className="text-sm text-muted-foreground mt-2">
                {getUpgradeMessage()}
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={handleUpgrade}
              className="flex items-center space-x-1"
            >
              <ArrowUp className="h-3 w-3" />
              <span>Upgrade</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Alert className={`${isAtLimit ? 'border-destructive' : 'border-warning'} ${className}`}>
      <AlertTriangle className={`h-4 w-4 ${isAtLimit ? 'text-destructive' : 'text-warning'}`} />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>{isAtLimit ? 'Entity limit reached!' : 'Approaching entity limit'}</strong>
          <br />
          You're using {currentEntities} of {maxEntities} entities ({percentageUsed.toFixed(0)}%).
          {nextTier && nextTierPrice && (
            <span className="block text-sm mt-1">
              Upgrade to {nextTier} for ${nextTierPrice}/month to get more entities.
            </span>
          )}
        </div>
        <Button size="sm" onClick={handleUpgrade} className="ml-4">
          Upgrade Plan
        </Button>
      </AlertDescription>
    </Alert>
  );
};