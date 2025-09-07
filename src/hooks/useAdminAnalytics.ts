import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from './useAdminAccess';
import { toast } from 'sonner';
import type {
  UserAnalytics,
  FinancialAnalytics,
  EntityAnalytics,
  OperationalAnalytics,
  BusinessIntelligence,
  AdminDashboardMetrics
} from '@/types/adminAnalytics';

export const useAdminAnalytics = () => {
  const { hasAdminAccess } = useAdminAccess();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>({
    userAnalytics: null,
    financialAnalytics: null,
    entityAnalytics: null,
    operationalAnalytics: null,
    businessIntelligence: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAnalytics = async (): Promise<UserAnalytics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_user_analytics');
      if (error) throw error;
      const result = data?.[0];
      if (!result) return null;
      
      return {
        ...result,
        users_by_role: result.users_by_role as Record<string, number>,
        geographic_distribution: result.geographic_distribution as Record<string, number>
      };
    } catch (err) {
      console.error('Error fetching user analytics:', err);
      return null;
    }
  };

  const fetchFinancialAnalytics = async (): Promise<FinancialAnalytics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_financial_analytics');
      if (error) throw error;
      const result = data?.[0];
      if (!result) return null;
      
      return {
        ...result,
        revenue_by_tier: result.revenue_by_tier as Record<string, number>
      };
    } catch (err) {
      console.error('Error fetching financial analytics:', err);
      return null;
    }
  };

  const fetchEntityAnalytics = async (): Promise<EntityAnalytics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_entity_analytics');
      if (error) throw error;
      const result = data?.[0];
      if (!result) return null;
      
      return {
        ...result,
        entities_by_type: result.entities_by_type as Record<string, number>,
        entities_by_state: result.entities_by_state as Record<string, number>
      };
    } catch (err) {
      console.error('Error fetching entity analytics:', err);
      return null;
    }
  };

  const fetchOperationalAnalytics = async (): Promise<OperationalAnalytics | null> => {
    try {
      const { data, error } = await supabase.rpc('get_operational_analytics');
      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.error('Error fetching operational analytics:', err);
      return null;
    }
  };

  const fetchBusinessIntelligence = async (): Promise<BusinessIntelligence | null> => {
    try {
      const { data, error } = await supabase.rpc('get_business_intelligence');
      if (error) throw error;
      const result = data?.[0];
      if (!result) return null;
      
      return {
        ...result,
        seasonal_patterns: result.seasonal_patterns as Record<string, number>,
        state_compliance_trends: result.state_compliance_trends as Record<string, number>,
        feature_adoption_rates: result.feature_adoption_rates as Record<string, number>,
        churn_risk_indicators: result.churn_risk_indicators as {
          high_risk: number;
          medium_risk: number;
          low_risk: number;
        }
      };
    } catch (err) {
      console.error('Error fetching business intelligence:', err);
      return null;
    }
  };

  const fetchAllAnalytics = async () => {
    if (!hasAdminAccess) {
      setError('Admin access required to view analytics');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        userAnalytics,
        financialAnalytics,
        entityAnalytics,
        operationalAnalytics,
        businessIntelligence
      ] = await Promise.all([
        fetchUserAnalytics(),
        fetchFinancialAnalytics(),
        fetchEntityAnalytics(),
        fetchOperationalAnalytics(),
        fetchBusinessIntelligence()
      ]);

      setMetrics({
        userAnalytics,
        financialAnalytics,
        entityAnalytics,
        operationalAnalytics,
        businessIntelligence
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(errorMessage);
      toast.error('Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalyticsReport = () => {
    if (!metrics.userAnalytics && !metrics.financialAnalytics) {
      toast.error('No data available to export');
      return;
    }

    const reportData = {
      generated_at: new Date().toISOString(),
      user_analytics: metrics.userAnalytics,
      financial_analytics: metrics.financialAnalytics,
      entity_analytics: metrics.entityAnalytics,
      operational_analytics: metrics.operationalAnalytics,
      business_intelligence: metrics.businessIntelligence,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Analytics report exported successfully');
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, [hasAdminAccess]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchAllAnalytics,
    exportReport: exportAnalyticsReport,
  };
};