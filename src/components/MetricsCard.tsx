import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  backgroundColor: string;
}

export const MetricsCard = memo<MetricsCardProps>(({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  backgroundColor
}) => {
  return (
    <Card className="border-border/50 hover:border-border hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div className={`w-12 h-12 ${backgroundColor} rounded-xl flex items-center justify-center shadow-sm border border-white/10`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
            <div className="text-sm font-medium text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MetricsCard.displayName = 'MetricsCard';