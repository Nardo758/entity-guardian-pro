import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnalyticsData, ComplianceCheck, CostProjection } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAnalytics = (entityId?: string) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [costProjections, setCostProjections] = useState<CostProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchAnalyticsData = async () => {
    if (!user) {
      setAnalyticsData([]);
      return;
    }

    try {
      let query = supabase
        .from('analytics_data')
        .select('*')
        .eq('user_id', user.id);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error: fetchError } = await query.order('metric_date', { ascending: false });

      if (fetchError) throw fetchError;
      setAnalyticsData((data || []) as AnalyticsData[]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load analytics data');
      setError(error);
      console.error('Error fetching analytics data:', err);
      toast.error(error.message);
    }
  };

  const fetchComplianceChecks = async () => {
    if (!user) {
      setComplianceChecks([]);
      return;
    }

    try {
      let query = supabase
        .from('compliance_checks')
        .select('*')
        .eq('user_id', user.id);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error: fetchError } = await query.order('due_date', { ascending: true });

      if (fetchError) throw fetchError;
      setComplianceChecks((data || []) as ComplianceCheck[]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load compliance checks');
      setError(error);
      console.error('Error fetching compliance checks:', err);
      toast.error(error.message);
    }
  };

  const fetchCostProjections = async () => {
    if (!user) {
      setCostProjections([]);
      return;
    }

    try {
      let query = supabase
        .from('cost_projections')
        .select('*')
        .eq('user_id', user.id);

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error: fetchError } = await query.order('projection_date', { ascending: false });

      if (fetchError) throw fetchError;
      setCostProjections((data || []) as CostProjection[]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load cost projections');
      setError(error);
      console.error('Error fetching cost projections:', err);
      toast.error(error.message);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([
      fetchAnalyticsData(),
      fetchComplianceChecks(),
      fetchCostProjections(),
    ]);
    setLoading(false);
  };

  const addAnalyticsData = async (data: Omit<AnalyticsData, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data: newData, error } = await supabase
        .from('analytics_data')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setAnalyticsData(prev => [newData as AnalyticsData, ...prev]);
      toast.success('Analytics data added successfully');
      return newData;
    } catch (error) {
      console.error('Error adding analytics data:', error);
      toast.error('Failed to add analytics data');
      throw error;
    }
  };

  const updateComplianceCheck = async (
    id: string, 
    updates: Partial<Omit<ComplianceCheck, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('compliance_checks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setComplianceChecks(prev => 
        prev.map(check => check.id === id ? data as ComplianceCheck : check)
      );
      toast.success('Compliance check updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating compliance check:', error);
      toast.error('Failed to update compliance check');
      throw error;
    }
  };

  const addCostProjection = async (data: Omit<CostProjection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data: newData, error } = await supabase
        .from('cost_projections')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCostProjections(prev => [newData as CostProjection, ...prev]);
      toast.success('Cost projection added successfully');
      return newData;
    } catch (error) {
      console.error('Error adding cost projection:', error);
      toast.error('Failed to add cost projection');
      throw error;
    }
  };

  useEffect(() => {
    fetchAllData();

    // Set up real-time subscriptions
    const analyticsChannel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analytics_data',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchAnalyticsData();
        }
      )
      .subscribe();

    const complianceChannel = supabase
      .channel('compliance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_checks',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchComplianceChecks();
        }
      )
      .subscribe();

    const projectionChannel = supabase
      .channel('projection-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cost_projections',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchCostProjections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(analyticsChannel);
      supabase.removeChannel(complianceChannel);
      supabase.removeChannel(projectionChannel);
    };
  }, [user, entityId]);

  return {
    analyticsData,
    complianceChecks,
    costProjections,
    loading,
    error,
    addAnalyticsData,
    updateComplianceCheck,
    addCostProjection,
    refetch: fetchAllData,
  };
};