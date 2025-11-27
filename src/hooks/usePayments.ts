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

      if (fetchError) {
        // Don't show error if table doesn't exist or user has no payments - this is expected
        console.warn('Could not fetch payments:', fetchError);
        setPayments([]);
        setError(null);
        return;
      }
      setPayments((data || []) as Payment[]);
    } catch (err) {
      // Silently handle errors - no payments is not an error condition
      console.warn('Error fetching payments:', err);
      setPayments([]);
      setError(null);
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
    // Only fetch once per user change, don't set up real-time subscriptions
    // as the payments table might not exist yet
    fetchPayments();
  }, [user?.id]);

  return {
    payments,
    loading,
    error,
    updatePaymentStatus,
    refetch: fetchPayments,
  };
};