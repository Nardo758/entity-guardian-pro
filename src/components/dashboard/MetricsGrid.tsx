import React from 'react';
import { 
  Building, 
  DollarSign, 
  Users, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status = 'info'
}) => {
  const statusColors = {
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    error: 'text-destructive bg-destructive/10 border-destructive/20',
    info: 'text-info bg-info/10 border-info/20'
  };

  return (
    <Card className="border-border/50 hover:border-border hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl border ${statusColors[status]}`}>
                <Icon className="h-5 w-5" />
              </div>
              {trend && (
                <Badge 
                  variant={trend.isPositive ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  <TrendingUp className={`h-3 w-3 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} />
                  {trend.value}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground leading-tight">
                {value}
              </div>
              <div className="text-sm font-medium text-foreground">
                {title}
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {subtitle}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface MetricsGridProps {
  metrics: {
    totalEntities: number;
    delawareEntities: number;
    annualEntityFees: number;
    annualServiceFees: number;
    pendingPayments: number;
    upcomingRenewals: number;
    pendingInvitations?: number;
    activeAgents?: number;
  };
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  const avgEntityFee = metrics.totalEntities > 0 
    ? (metrics.annualEntityFees / metrics.totalEntities).toFixed(0) 
    : '0';

  const metricsData = [
    {
      title: 'Active Entities',
      value: metrics.totalEntities,
      subtitle: `${metrics.delawareEntities} Delaware • ${metrics.totalEntities - metrics.delawareEntities} Other States`,
      icon: Building,
      status: 'info' as const,
      trend: metrics.totalEntities > 0 ? { value: '+12%', isPositive: true } : undefined
    },
    {
      title: 'Annual Entity Fees',
      value: `$${metrics.annualEntityFees.toLocaleString()}`,
      subtitle: `Avg $${avgEntityFee} per entity • State filing requirements`,
      icon: FileText,
      status: 'success' as const,
      trend: { value: '+5%', isPositive: true }
    },
    {
      title: 'Service Fees',
      value: `$${metrics.annualServiceFees.toLocaleString()}`,
      subtitle: `${metrics.activeAgents || 0} active agents • ${metrics.pendingInvitations || 0} pending invitations`,
      icon: Users,
      status: 'info' as const,
      trend: (metrics.pendingInvitations || 0) > 0 ? { value: `+${metrics.pendingInvitations}`, isPositive: true } : undefined
    },
    {
      title: 'Pending Actions',
      value: `$${metrics.pendingPayments.toLocaleString()}`,
      subtitle: `${metrics.upcomingRenewals} renewals due • Requires attention`,
      icon: AlertTriangle,
      status: metrics.pendingPayments > 0 ? 'warning' as const : 'success' as const,
      trend: metrics.pendingPayments > 0 ? { value: '-8%', isPositive: false } : undefined
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};