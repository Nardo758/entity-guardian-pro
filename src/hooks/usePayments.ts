import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchPayments = async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPayments((data || []) as Payment[]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load payments');
      setError(error);
      console.error('Error fetching payments:', err);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (id: string, status: Payment['status'], paymentMethodId?: string) => {
    if (!user) return;

    try {
      const updateData: any = { status };
      if (status === 'paid') {
        updateData.paid_date = new Date().toISOString();
      }
      if (paymentMethodId) {
        updateData.payment_method = paymentMethodId;
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPayments(prev => 
        prev.map(payment => 
          payment.id === id 
            ? { ...payment, ...updateData }
            : payment
        )
      );
      
      toast.success(`Payment ${status === 'paid' ? 'processed' : 'updated'} successfully`);
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
      throw error;
    }
  };

  useEffect(() => {
    fetchPayments();

    // Set up real-time subscription
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    payments,
    loading,
    error,
    updatePaymentStatus,
    refetch: fetchPayments,
  };
};