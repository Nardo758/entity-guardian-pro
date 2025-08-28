import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyticsData } from '@/types/entity';
import { format } from 'date-fns';

interface MetricsChartProps {
  analyticsData: AnalyticsData[];
  title?: string;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ 
  analyticsData, 
  title = 'Business Metrics Overview' 
}) => {
  const [selectedMetric, setSelectedMetric] = React.useState<string>('all');

  // Get unique metric types
  const metricTypes = React.useMemo(() => {
    const types = [...new Set(analyticsData.map(d => d.metric_type))];
    return [{ value: 'all', label: 'All Metrics' }, ...types.map(t => ({ value: t, label: t }))];
  }, [analyticsData]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const filteredData = selectedMetric === 'all' 
      ? analyticsData 
      : analyticsData.filter(d => d.metric_type === selectedMetric);

    // Group by date and sum values
    const groupedData: Record<string, { date: string; value: number; count: number }> = {};

    filteredData.forEach(item => {
      const date = format(new Date(item.metric_date), 'MMM dd');
      if (!groupedData[date]) {
        groupedData[date] = { date, value: 0, count: 0 };
      }
      groupedData[date].value += Number(item.metric_value);
      groupedData[date].count += 1;
    });

    return Object.values(groupedData)
      .map(item => ({
        ...item,
        average: item.value / item.count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analyticsData, selectedMetric]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Total: {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Average: {data.average.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">
            Data points: {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  if (analyticsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No analytics data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{title}</CardTitle>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metricTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};