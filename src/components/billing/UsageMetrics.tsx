import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Database, FileText, Zap, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!user || loading) return;

    // Set up real-time subscription for usage changes
    const channel = supabase
      .channel('usage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUsageData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUsageData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loading]);

  const fetchUsageData = async () => {
    try {
      // Get subscription info
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('entities_limit, plan_id')
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
        const tier = subscription?.plan_id || 'free';
      const limits = {
        free: { entities: 5, storage: 1, api: 100 },
          starter: { entities: 10, storage: 5, api: 1000 },
          growth: { entities: 20, storage: 15, api: 3000 },
          professional: { entities: 50, storage: 50, api: 10000 },
          enterprise: { entities: 150, storage: 200, api: 50000 },
      };

      const tierLimits = limits[tier as keyof typeof limits] || limits.starter;

      const newUsage = {
        entitiesUsed: entitiesCount || 0,
        entitiesLimit: subscription?.entities_limit || tierLimits.entities,
        storageUsed: (documentsCount || 0) * 0.5, // Estimate 0.5GB per document
        storageLimit: tierLimits.storage,
        apiCalls: Math.floor(Math.random() * 500), // Mock data - would come from analytics
        apiLimit: tierLimits.api,
      };

      setUsage(newUsage);

      // Check for threshold alerts
      await checkUsageThresholds(newUsage);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUsageThresholds = async (currentUsage: UsageData) => {
    const threshold = 90; // 90% threshold
    const alerts: Array<{ type: string; percentage: number }> = [];

    // Check entities
    const entitiesPercentage = (currentUsage.entitiesUsed / currentUsage.entitiesLimit) * 100;
    if (entitiesPercentage >= threshold) {
      alerts.push({ type: 'entities', percentage: entitiesPercentage });
    }

    // Check storage
    const storagePercentage = (currentUsage.storageUsed / currentUsage.storageLimit) * 100;
    if (storagePercentage >= threshold) {
      alerts.push({ type: 'storage', percentage: storagePercentage });
    }

    // Check API calls
    const apiPercentage = (currentUsage.apiCalls / currentUsage.apiLimit) * 100;
    if (apiPercentage >= threshold) {
      alerts.push({ type: 'API calls', percentage: apiPercentage });
    }

    // Create notifications for each alert
    for (const alert of alerts) {
      await createUsageAlert(alert.type, alert.percentage, currentUsage);
    }
  };

  const createUsageAlert = async (type: string, percentage: number, currentUsage: UsageData) => {
    try {
      // Check if we already sent a notification recently (within last 24 hours)
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id, created_at')
        .eq('user_id', user?.id)
        .eq('type', 'warning')
        .ilike('title', `%${type}%`)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        return; // Don't spam notifications
      }

      const usageText = type === 'entities' 
        ? `${currentUsage.entitiesUsed} of ${currentUsage.entitiesLimit}`
        : type === 'storage'
        ? `${currentUsage.storageUsed.toFixed(1)} GB of ${currentUsage.storageLimit} GB`
        : `${currentUsage.apiCalls.toLocaleString()} of ${currentUsage.apiLimit.toLocaleString()}`;

      // Create persistent notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user?.id,
          type: 'warning',
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Limit Warning`,
          message: `You've used ${percentage.toFixed(0)}% of your ${type} limit (${usageText}). Consider upgrading your plan to avoid service interruption.`,
          read: false
        });

      if (error) throw error;

      // Show immediate toast notification
      toast.error(
        `Usage Alert: ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        {
          description: `You're at ${percentage.toFixed(0)}% of your limit. Consider upgrading your plan.`,
          icon: <AlertTriangle className="h-5 w-5" />,
          duration: 8000,
        }
      );
    } catch (error) {
      console.error('Error creating usage alert:', error);
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
