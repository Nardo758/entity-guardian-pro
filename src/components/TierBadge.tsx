import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, Rocket } from 'lucide-react';
import { useTierPermissions } from '@/hooks/useTierPermissions';

interface TierBadgeProps {
  tier?: string;
  showIcon?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ 
  tier, 
  showIcon = true, 
  variant = 'default',
  className = ''
}) => {
  const permissions = useTierPermissions();
  const currentTier = tier || permissions.currentTier;
  
  const getTierConfig = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'starter':
        return {
          icon: Star,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          label: 'Starter'
        };
      case 'growth':
        return {
          icon: Zap,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Growth'
        };
      case 'professional':
        return {
          icon: Crown,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          label: 'Professional'
        };
      case 'enterprise':
        return {
          icon: Rocket,
          color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800 border-orange-200',
          label: 'Enterprise'
        };
      default:
        return {
          icon: Star,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: tierName
        };
    }
  };

  const config = getTierConfig(currentTier);
  const Icon = config.icon;

  return (
    <Badge 
      variant={variant}
      className={`${config.color} ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};

// Component to show current plan status
export const CurrentPlanBadge: React.FC<{ className?: string }> = ({ className }) => {
  const permissions = useTierPermissions();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Current Plan:</span>
      <TierBadge />
      <span className="text-xs text-muted-foreground">
        ({permissions.maxEntities} entities)
      </span>
    </div>
  );
};