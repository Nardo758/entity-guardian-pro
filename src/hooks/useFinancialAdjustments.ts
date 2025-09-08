import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FinancialAdjustment {
  id: string;
  user_id: string;
  admin_id: string;
  adjustment_type: 'refund' | 'credit' | 'debit' | 'fee_waiver';
  amount: number;
  currency: string;
  reason: string;
  reference_payment_id?: string;
  metadata?: any;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export const useFinancialAdjustments = () => {
  const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAdjustments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_adjustments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdjustments((data || []) as FinancialAdjustment[]);
    } catch (error) {
      console.error('Error fetching financial adjustments:', error);
      toast.error('Failed to load financial adjustments');
    } finally {
      setLoading(false);
    }
  };

  const createAdjustment = async (
    targetUserId: string,
    adjustmentType: 'refund' | 'credit' | 'debit' | 'fee_waiver',
    amount: number,
    reason: string,
    referencePaymentId?: string
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('financial_adjustments')
        .insert({
          user_id: targetUserId,
          admin_id: user.id,
          adjustment_type: adjustmentType,
          amount,
          reason,
          reference_payment_id: referencePaymentId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Financial adjustment created successfully');
      await fetchAdjustments();
      return data as FinancialAdjustment;
    } catch (error) {
      console.error('Error creating financial adjustment:', error);
      toast.error('Failed to create financial adjustment');
      throw error;
    }
  };

  const updateAdjustmentStatus = async (
    adjustmentId: string,
    status: 'approved' | 'processed' | 'rejected'
  ) => {
    if (!user) return;

    try {
      const updateData: any = { status };
      
      if (status === 'processed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('financial_adjustments')
        .update(updateData)
        .eq('id', adjustmentId);

      if (error) throw error;

      toast.success(`Adjustment ${status} successfully`);
      await fetchAdjustments();
    } catch (error) {
      console.error('Error updating adjustment status:', error);
      toast.error('Failed to update adjustment status');
      throw error;
    }
  };

  const processRefund = async (adjustmentId: string) => {
    if (!user) return;

    try {
      // This would integrate with Stripe or payment processor
      // For now, we'll just mark as processed
      await updateAdjustmentStatus(adjustmentId, 'processed');
      
      toast.success('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
      throw error;
    }
  };

  const applyCreditToAccount = async (adjustmentId: string) => {
    if (!user) return;

    try {
      // This would add credit to user's account balance
      // For now, we'll just mark as processed
      await updateAdjustmentStatus(adjustmentId, 'processed');
      
      toast.success('Credit applied to account successfully');
    } catch (error) {
      console.error('Error applying credit:', error);
      toast.error('Failed to apply credit');
      throw error;
    }
  };

  const getAdjustmentsByUser = (userId: string) => {
    return adjustments.filter(adj => adj.user_id === userId);
  };

  const getPendingAdjustments = () => {
    return adjustments.filter(adj => adj.status === 'pending');
  };

  const getTotalAdjustmentsByType = (type: string) => {
    return adjustments
      .filter(adj => adj.adjustment_type === type && adj.status === 'processed')
      .reduce((total, adj) => total + adj.amount, 0);
  };

  useEffect(() => {
    if (user) {
      fetchAdjustments();
    }
  }, [user]);

  return {
    adjustments,
    loading,
    createAdjustment,
    updateAdjustmentStatus,
    processRefund,
    applyCreditToAccount,
    getAdjustmentsByUser,
    getPendingAdjustments,
    getTotalAdjustmentsByType,
    refetch: fetchAdjustments,
  };
};