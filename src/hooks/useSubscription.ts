import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { stripePromise } from '@/lib/stripe';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ subscribed: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ subscribed: false });
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase.functions.invoke('check-subscription');
      
      if (fetchError) throw fetchError;
      
      setSubscription(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to check subscription status');
      setError(error);
      console.error('Error checking subscription:', err);
      toast.error(error.message);
      setSubscription({ subscribed: false });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCheckout = async (tier: string, billing: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return null;
    }

    try {
      toast.loading('Creating checkout session...', { id: 'checkout' });
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier, billing }
      });

      if (error) throw error;

      if (!data || !data.id) {
        throw new Error('Invalid checkout session response');
      }

      toast.success('Redirecting to checkout...', { id: 'checkout' });

      // Consolidated flow: Always use Stripe redirect (removes dual path confusion)
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load. Please check your internet connection and try again.');
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.id });
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to redirect to checkout');
      }

      return data;
    } catch (error) {
      console.error('Error creating checkout:', error);
      const message = error instanceof Error ? error.message : 'Failed to create checkout session';
      toast.error(message, { id: 'checkout' });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast.error('Please log in to manage subscription');
      return;
    }

    try {
      toast.loading('Opening billing portal...', { id: 'portal' });

      // Ensure we have a fresh access token and pass the app origin explicitly
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          'x-app-origin': window.location.origin,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No portal URL returned');

      toast.dismiss('portal');
      // Use same-tab navigation to avoid popup blockers
      window.location.assign(data.url as string);
    } catch (error) {
      console.error('Error opening customer portal:', error);
      const message = error instanceof Error ? error.message : 'Failed to open customer portal';
      toast.error(message, { id: 'portal' });
    }
  };
  useEffect(() => {
    checkSubscription();

    // Set up real-time subscription for subscription changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscribers',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          console.log('Subscription changed, refreshing...');
          checkSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, checkSubscription]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
};