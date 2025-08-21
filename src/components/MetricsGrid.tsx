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
        return 'bg-gradient-to-br from-primary-muted via-primary-muted/80 to-primary-muted/60 border-primary/20 hover:border-primary/30';
      case 'success':
        return 'bg-gradient-to-br from-success-muted via-success-muted/80 to-success-muted/60 border-success/20 hover:border-success/30';
      case 'info':
        return 'bg-gradient-to-br from-info-muted via-info-muted/80 to-info-muted/60 border-info/20 hover:border-info/30';
      case 'warning':
        return 'bg-gradient-to-br from-warning-muted via-warning-muted/80 to-warning-muted/60 border-warning/20 hover:border-warning/30';
      default:
        return 'bg-gradient-to-br from-muted via-muted/80 to-muted/60 border-border';
    }
  };

  const getIconStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'text-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-md';
      case 'success':
        return 'text-success bg-gradient-to-br from-success/20 to-success/10 shadow-md';
      case 'info':
        return 'text-info bg-gradient-to-br from-info/20 to-info/10 shadow-md';
      case 'warning':
        return 'text-warning bg-gradient-to-br from-warning/20 to-warning/10 shadow-md';
      default:
        return 'text-muted-foreground bg-gradient-to-br from-muted/20 to-muted/10 shadow-md';
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
    <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={`group border shadow-modern hover:shadow-modern-lg transition-all duration-500 hover:scale-105 animate-fade-up backdrop-blur-sm ${getCardStyles(card.variant)}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className={`rounded-xl p-3 transition-all duration-300 group-hover:scale-110 ${getIconStyles(card.variant)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className={`text-3xl font-bold mb-2 font-display ${getValueStyles(card.variant)}`}>
                {card.value}
              </div>
              <div className="text-sm font-medium text-foreground mb-2">
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