import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ManagedSubscription {
  id: string;
  user_id: string | null;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscribed: boolean | null;
  is_trial_active: boolean | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  entities_limit: number | null;
  created_at: string;
  updated_at: string | null;
  owner_name: string;
}

export interface ManagedInvoice {
  id: string;
  user_id: string | null;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
  owner_email: string;
}

export const useAdminBillingManagement = () => {
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading: loadingSubscriptions, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['admin-managed-subscriptions'],
    queryFn: async () => {
      const { data: subscribersData, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscribersError) throw subscribersError;

      // Get owner profiles
      const userIds = [...new Set((subscribersData || []).filter(s => s.user_id).map(s => s.user_id!))];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, company')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const managedSubscriptions: ManagedSubscription[] = (subscribersData || []).map(sub => {
        const profile = profileMap.get(sub.user_id || '');
        const ownerName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.company || 'Unknown'
          : 'Unknown';

        return {
          ...sub,
          owner_name: ownerName,
        };
      });

      return managedSubscriptions;
    },
  });

  const { data: invoices, isLoading: loadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['admin-managed-invoices'],
    queryFn: async () => {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('stripe_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Get subscriber emails for invoice display
      const customerIds = [...new Set((invoicesData || []).map(i => i.stripe_customer_id))];
      
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('stripe_customer_id, email')
        .in('stripe_customer_id', customerIds);

      if (subscribersError) throw subscribersError;

      const emailMap = new Map((subscribers || []).map(s => [s.stripe_customer_id, s.email]));

      const managedInvoices: ManagedInvoice[] = (invoicesData || []).map(inv => ({
        ...inv,
        owner_email: emailMap.get(inv.stripe_customer_id) || 'N/A',
      }));

      return managedInvoices;
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({
      subscriberId,
      updates,
    }: {
      subscriberId: string;
      updates: Partial<{
        subscription_tier: string;
        subscription_status: string;
        entities_limit: number;
        is_trial_active: boolean;
        cancel_at_period_end: boolean;
      }>;
    }) => {
      const { error } = await supabase
        .from('subscribers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-subscriptions'] });
      toast.success('Subscription updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update subscription: ${error.message}`);
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriberId: string) => {
      const { error } = await supabase
        .from('subscribers')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-managed-subscriptions'] });
      toast.success('Subscription set to cancel at period end');
    },
    onError: (error) => {
      toast.error(`Failed to cancel subscription: ${error.message}`);
    },
  });

  const stats = {
    totalSubscribers: subscriptions?.length || 0,
    activeSubscriptions: subscriptions?.filter(s => s.subscribed).length || 0,
    trialsActive: subscriptions?.filter(s => s.is_trial_active).length || 0,
    cancelPending: subscriptions?.filter(s => s.cancel_at_period_end).length || 0,
    byTier: subscriptions?.reduce((acc, s) => {
      const tier = s.subscription_tier || 'free';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {},
    totalInvoices: invoices?.length || 0,
    paidInvoices: invoices?.filter(i => i.status === 'paid').length || 0,
    pendingInvoices: invoices?.filter(i => i.status === 'open' || i.status === 'draft').length || 0,
    totalRevenue: invoices?.reduce((sum, i) => sum + (i.amount_paid || 0), 0) || 0,
  };

  return {
    subscriptions: subscriptions || [],
    invoices: invoices || [],
    isLoading: loadingSubscriptions || loadingInvoices,
    refetch: () => {
      refetchSubscriptions();
      refetchInvoices();
    },
    stats,
    updateSubscription: updateSubscriptionMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    isUpdating: updateSubscriptionMutation.isPending,
  };
};
