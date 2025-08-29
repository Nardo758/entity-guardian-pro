import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ComplianceCheck {
  id: string;
  entity_id?: string;
  user_id: string;
  check_type: string;
  check_name: string;
  status: 'pending' | 'completed' | 'overdue' | 'failed';
  due_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useComplianceChecks = (entityId?: string) => {
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchComplianceChecks = useCallback(async () => {
    if (!user) {
      setComplianceChecks([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('compliance_checks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComplianceChecks((data || []) as ComplianceCheck[]);
    } catch (error) {
      console.error('Error fetching compliance checks:', error);
      toast.error('Failed to load compliance checks');
    } finally {
      setLoading(false);
    }
  }, [user, entityId]);

  const addComplianceCheck = async (checkData: Omit<ComplianceCheck, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('compliance_checks')
        .insert({
          ...checkData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setComplianceChecks(prev => [data as ComplianceCheck, ...prev]);
      toast.success('Compliance check added successfully');
      return data as ComplianceCheck;
    } catch (error) {
      console.error('Error adding compliance check:', error);
      toast.error('Failed to add compliance check');
      throw error;
    }
  };

  const updateComplianceCheck = async (id: string, checkData: Partial<Omit<ComplianceCheck, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('compliance_checks')
        .update(checkData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setComplianceChecks(prev => prev.map(check => 
        check.id === id ? data as ComplianceCheck : check
      ));
      toast.success('Compliance check updated successfully');
      return data as ComplianceCheck;
    } catch (error) {
      console.error('Error updating compliance check:', error);
      toast.error('Failed to update compliance check');
      throw error;
    }
  };

  const deleteComplianceCheck = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('compliance_checks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setComplianceChecks(prev => prev.filter(check => check.id !== id));
      toast.success('Compliance check deleted successfully');
    } catch (error) {
      console.error('Error deleting compliance check:', error);
      toast.error('Failed to delete compliance check');
      throw error;
    }
  };

  useEffect(() => {
    fetchComplianceChecks();

    // Set up real-time subscription
    const channel = supabase
      .channel('compliance-checks-changes')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComplianceChecks, user]);

  return {
    complianceChecks,
    loading,
    addComplianceCheck,
    updateComplianceCheck,
    deleteComplianceCheck,
    refetch: fetchComplianceChecks,
  };
};