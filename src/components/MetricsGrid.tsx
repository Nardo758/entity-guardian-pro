import React from 'react';
import { Building, DollarSign, User, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricsGridProps {
  metrics: {
    totalEntities: number;
    delawareEntities: number;
    annualEntityFees: number;
    annualServiceFees: number;
    pendingPayments: number;
  };
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  const metricCards = [
    {
      title: 'Active Entities',
      value: metrics.totalEntities.toString(),
      subtitle: `${metrics.delawareEntities} Delaware entities`,
      icon: Building,
      variant: 'primary' as const
    },
    {
      title: 'Annual Entity Fees',
      value: `$${metrics.annualEntityFees.toLocaleString()}`,
      subtitle: `Avg: $${metrics.totalEntities > 0 ? Math.round(metrics.annualEntityFees / metrics.totalEntities) : 0} per entity`,
      icon: DollarSign,
      variant: 'success' as const
    },
    {
      title: 'Annual Service Fees',
      value: `$${metrics.annualServiceFees.toLocaleString()}`,
      subtitle: 'Registered agents & directors',
      icon: User,
      variant: 'info' as const
    },
    {
      title: 'Pending Payments',
      value: `$${metrics.pendingPayments.toLocaleString()}`,
      subtitle: 'Requires attention',
      icon: AlertTriangle,
      variant: 'warning' as const
    }
  ];

  const getCardStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-muted border-primary/20';
      case 'success':
        return 'bg-success-muted border-success/20';
      case 'info':
        return 'bg-info-muted border-info/20';
      case 'warning':
        return 'bg-warning-muted border-warning/20';
      default:
        return 'bg-muted border-border';
    }
  };

  const getIconStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'text-primary bg-primary/10';
      case 'success':
        return 'text-success bg-success/10';
      case 'info':
        return 'text-info bg-info/10';
      case 'warning':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getValueStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'text-primary';
      case 'success':
        return 'text-success';
      case 'info':
        return 'text-info';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={`border shadow-sm ${getCardStyles(card.variant)}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-lg p-2 ${getIconStyles(card.variant)}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className={`text-2xl font-bold ${getValueStyles(card.variant)} mb-1`}>
                {card.value}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {card.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {card.subtitle}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};