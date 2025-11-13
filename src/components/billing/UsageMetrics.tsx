import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Database, FileText, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UsageData {
  entitiesUsed: number;
  entitiesLimit: number;
  storageUsed: number;
  storageLimit: number;
  apiCalls: number;
  apiLimit: number;
}

export const UsageMetrics = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData>({
    entitiesUsed: 0,
    entitiesLimit: 10,
    storageUsed: 0,
    storageLimit: 5,
    apiCalls: 0,
    apiLimit: 1000,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    try {
      // Get subscription info
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('entities_limit, subscription_tier')
        .eq('user_id', user?.id)
        .single();

      // Get entities count
      const { count: entitiesCount } = await supabase
        .from('entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get documents count for storage estimate
      const { count: documentsCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Set limits based on tier
      const tier = subscription?.subscription_tier || 'free';
      const limits = {
        free: { entities: 5, storage: 1, api: 100 },
        starter: { entities: 10, storage: 5, api: 1000 },
        pro: { entities: 50, storage: 25, api: 5000 },
        premium: { entities: 200, storage: 100, api: 20000 },
      };

      const tierLimits = limits[tier as keyof typeof limits] || limits.starter;

      setUsage({
        entitiesUsed: entitiesCount || 0,
        entitiesLimit: subscription?.entities_limit || tierLimits.entities,
        storageUsed: (documentsCount || 0) * 0.5, // Estimate 0.5GB per document
        storageLimit: tierLimits.storage,
        apiCalls: Math.floor(Math.random() * 500), // Mock data - would come from analytics
        apiLimit: tierLimits.api,
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-yellow-600";
    return "text-success";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage & Limits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage & Limits
        </CardTitle>
        <CardDescription>
          Track your current usage against plan limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Entities Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Entities</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usage.entitiesUsed, usage.entitiesLimit))}`}>
                {usage.entitiesUsed} / {usage.entitiesLimit}
              </span>
              {getUsagePercentage(usage.entitiesUsed, usage.entitiesLimit) >= 90 && (
                <Badge variant="destructive" className="text-xs">Near Limit</Badge>
              )}
            </div>
          </div>
          <Progress value={getUsagePercentage(usage.entitiesUsed, usage.entitiesLimit)} className="h-2" />
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usage.storageUsed, usage.storageLimit))}`}>
                {usage.storageUsed.toFixed(1)} GB / {usage.storageLimit} GB
              </span>
            </div>
          </div>
          <Progress value={getUsagePercentage(usage.storageUsed, usage.storageLimit)} className="h-2" />
        </div>

        {/* API Calls Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">API Calls (30 days)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${getUsageColor(getUsagePercentage(usage.apiCalls, usage.apiLimit))}`}>
                {usage.apiCalls.toLocaleString()} / {usage.apiLimit.toLocaleString()}
              </span>
            </div>
          </div>
          <Progress value={getUsagePercentage(usage.apiCalls, usage.apiLimit)} className="h-2" />
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Upgrade your plan to increase limits
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
