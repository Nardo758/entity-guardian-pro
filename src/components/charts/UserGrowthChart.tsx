import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, UserPlus, Globe } from 'lucide-react';
import type { UserAnalytics } from '@/types/adminAnalytics';

interface UserGrowthChartProps {
  data: UserAnalytics;
  title?: string;
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ 
  data, 
  title = 'User Analytics Dashboard' 
}) => {
  // Prepare role distribution data for chart
  const roleData = Object.entries(data.users_by_role).map(([role, count]) => ({
    role: role.charAt(0).toUpperCase() + role.slice(1),
    count,
    percentage: ((count / data.total_users) * 100).toFixed(1)
  }));

  // Prepare geographic data for chart
  const geoData = Object.entries(data.geographic_distribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([state, count]) => ({
      state,
      count,
      percentage: ((count / data.total_entities) * 100).toFixed(1)
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

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered users on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Growth</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{data.user_growth_30d.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New users last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">7-Day Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              +{data.user_growth_7d.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New users last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.user_retention_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              30-day user retention
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
          <Tabs defaultValue="roles" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roles">User Roles Distribution</TabsTrigger>
              <TabsTrigger value="geography">Geographic Distribution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="roles" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="role" 
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--chart-1))" 
                      name="Users"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Role Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                {roleData.map((role) => (
                  <div key={role.role} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{role.role}</p>
                      <p className="text-sm text-muted-foreground">{role.percentage}% of users</p>
                    </div>
                    <Badge variant="secondary">{role.count}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="geography" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geoData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number"
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="state"
                      className="text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--chart-2))" 
                      name="Entities"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Geographic Statistics */}
              <div className="grid gap-2 md:grid-cols-2">
                {geoData.slice(0, 6).map((geo) => (
                  <div key={geo.state} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">{geo.state}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{geo.percentage}%</span>
                      <Badge variant="outline" className="text-xs">{geo.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};