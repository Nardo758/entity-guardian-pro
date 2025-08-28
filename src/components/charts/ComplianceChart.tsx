import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComplianceCheck } from '@/types/entity';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

interface ComplianceChartProps {
  complianceChecks: ComplianceCheck[];
  title?: string;
}

const COLORS = {
  completed: 'hsl(var(--chart-1))',
  pending: 'hsl(var(--chart-2))',
  overdue: 'hsl(var(--chart-3))',
  failed: 'hsl(var(--chart-4))',
};

const STATUS_ICONS = {
  completed: CheckCircle,
  pending: Clock,
  overdue: AlertTriangle,
  failed: XCircle,
};

export const ComplianceChart: React.FC<ComplianceChartProps> = ({ 
  complianceChecks, 
  title = 'Compliance Status Overview' 
}) => {
  const statusCounts = complianceChecks.reduce((acc, check) => {
    acc[check.status] = (acc[check.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    color: COLORS[status as keyof typeof COLORS],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium capitalize">{data.status}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} item{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        {payload.map((entry: any, index: number) => {
          const Icon = STATUS_ICONS[entry.payload.status as keyof typeof STATUS_ICONS];
          return (
            <div key={index} className="flex items-center gap-2">
              <Icon className="h-4 w-4" style={{ color: entry.color }} />
              <span className="text-sm capitalize">{entry.payload.status}</span>
              <span className="text-sm text-muted-foreground">({entry.payload.count})</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (complianceChecks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No compliance checks found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="40%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};