import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CostProjection, Payment } from '@/types/entity';
import { format } from 'date-fns';

interface CostAnalysisChartProps {
  costProjections: CostProjection[];
  payments: Payment[];
  title?: string;
}

export const CostAnalysisChart: React.FC<CostAnalysisChartProps> = ({ 
  costProjections, 
  payments,
  title = 'Cost Analysis & Projections' 
}) => {
  // Prepare trend data combining projections and actual payments
  const trendData = React.useMemo(() => {
    const data: Record<string, { month: string; projected: number; actual: number; }> = {};

    // Add projections
    costProjections.forEach(projection => {
      const month = format(new Date(projection.projection_date), 'MMM yyyy');
      if (!data[month]) {
        data[month] = { month, projected: 0, actual: 0 };
      }
      data[month].projected += Number(projection.projected_amount);
      if (projection.actual_amount) {
        data[month].actual += Number(projection.actual_amount);
      }
    });

    // Add actual payments
    payments.filter(p => p.status === 'paid').forEach(payment => {
      const month = format(new Date(payment.paid_date || payment.due_date), 'MMM yyyy');
      if (!data[month]) {
        data[month] = { month, projected: 0, actual: 0 };
      }
      data[month].actual += Number(payment.amount);
    });

    return Object.values(data).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [costProjections, payments]);

  // Prepare variance data
  const varianceData = React.useMemo(() => {
    return costProjections
      .filter(p => p.actual_amount !== null)
      .map(projection => ({
        name: projection.projection_name,
        projected: Number(projection.projected_amount),
        actual: Number(projection.actual_amount || 0),
        variance: Number(projection.variance || 0),
        date: format(new Date(projection.projection_date), 'MMM dd'),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [costProjections]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (costProjections.length === 0 && payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No cost data available for analysis</p>
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
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trends">Cost Trends</TabsTrigger>
            <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="projected" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Projected"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="variance" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varianceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="projected" 
                    fill="hsl(var(--chart-1))" 
                    name="Projected"
                    opacity={0.7}
                  />
                  <Bar 
                    dataKey="actual" 
                    fill="hsl(var(--chart-2))" 
                    name="Actual"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};