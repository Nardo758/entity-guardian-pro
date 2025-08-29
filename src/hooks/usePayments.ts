import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPayments = async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data || []) as Payment[]);
    } catch (error) {
      toast.error('Failed to load payments');
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
      toast.error('Failed to update payment');
      throw error;
    }
  };

  const processStripePayment = async (paymentId: string, paymentMethodId: string, amount: number) => {
    if (!user) return;

    try {
      setPayments(prev => 
        prev.map(payment => 
          payment.id === paymentId 
            ? { ...payment, processing_status: 'processing' }
            : payment
        )
      );

      const { data, error } = await supabase.functions.invoke('process-stripe-payment', {
        body: { paymentId, paymentMethodId, amount }
      });

      if (error) throw error;

      if (data.success) {
        await fetchPayments(); // Refresh to get updated status
        toast.success('Payment processed successfully');
      } else {
        throw new Error('Payment failed');
      }

      return data;
    } catch (error) {
      toast.error('Payment processing failed');
      // Refresh to reset status
      await fetchPayments();
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
    updatePaymentStatus,
    processStripePayment,
    refetch: fetchPayments,
  };
};