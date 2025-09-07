import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Map, TrendingUp, Users } from 'lucide-react';
import type { EntityAnalytics } from '@/types/adminAnalytics';

interface EntityDistributionChartProps {
  data: EntityAnalytics;
  title?: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const EntityDistributionChart: React.FC<EntityDistributionChartProps> = ({ 
  data, 
  title = 'Entity Management Analytics' 
}) => {
  // Prepare entity type data for chart
  const typeData = Object.entries(data.entities_by_type).map(([type, count], index) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count: Number(count),
    percentage: ((Number(count) / data.total_entities) * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  }));

  // Prepare state data for chart (top 10 states)
  const stateData = Object.entries(data.entities_by_state)
    .sort(([,a], [,b]) => Number(b) - Number(a))
    .slice(0, 10)
    .map(([state, count]) => ({
      state,
      count: Number(count),
      percentage: ((Number(count) / data.total_entities) * 100).toFixed(1)
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.payload.percentage && ` (${entry.payload.percentage}%)`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.type}</p>
          <p className="text-sm text-muted-foreground">
            Count: {data.count} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Entity Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_entities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered business entities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{data.entity_creation_rate_30d.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New entities created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entities per Customer</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.avg_entities_per_customer}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average per customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular State</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.most_popular_state}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Most registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="types" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="types">Entity Types</TabsTrigger>
              <TabsTrigger value="geography">Geographic Distribution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="types" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Entity Type Breakdown</h4>
                  {typeData.map((type, index) => (
                    <div key={type.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        <div>
                          <p className="font-medium">{type.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {type.percentage}% of entities
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{type.count}</Badge>
                    </div>
                  ))}
                  
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Most Popular Type</h5>
                    <p className="text-sm">
                      <span className="font-semibold">{data.most_popular_entity_type?.replace('_', ' ').toUpperCase()}</span>
                      {' '}is the most commonly registered entity type
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="geography" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stateData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="state" 
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--chart-2))" 
                      name="Entities"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Geographic Statistics */}
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {stateData.slice(0, 9).map((state) => (
                  <div key={state.state} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{state.state}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{state.percentage}%</span>
                      <Badge variant="outline" className="text-xs">{state.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Geographic Insights</h5>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">{data.most_popular_state}</span> leads with the highest number of entity registrations, 
                  representing a significant portion of business formations.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};