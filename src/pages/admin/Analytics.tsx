import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { BarChart3, TrendingUp, Users, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Analytics: React.FC = () => {
  const { metrics, loading: isLoading } = useAdminAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400">Business intelligence and performance metrics</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="users" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Users
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="entities" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Entities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Users</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics?.userAnalytics?.total_users || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Growth (30d)</p>
                    <p className="text-2xl font-bold text-white">
                      +{metrics?.userAnalytics?.user_growth_30d || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Conversion Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics?.userAnalytics?.trial_to_paid_conversion || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">User Distribution by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.userAnalytics?.users_by_role && 
                  Object.entries(metrics.userAnalytics.users_by_role).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                      <span className="text-slate-400 capitalize">{role || 'Unknown'}</span>
                      <span className="text-white font-medium">{count as number}</span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${((metrics?.financialAnalytics?.total_revenue || 0) / 100).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">MRR</p>
                <p className="text-2xl font-bold text-white">
                  ${(metrics?.financialAnalytics?.mrr || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">ARR</p>
                <p className="text-2xl font-bold text-white">
                  ${(metrics?.financialAnalytics?.arr || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Entities</p>
                    <p className="text-2xl font-bold text-white">
                      {metrics?.entityAnalytics?.total_entities || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">Most Popular Type</p>
                <p className="text-xl font-bold text-white capitalize">
                  {metrics?.entityAnalytics?.most_popular_entity_type || 'N/A'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400">Most Popular State</p>
                <p className="text-xl font-bold text-white">
                  {metrics?.entityAnalytics?.most_popular_state || 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
