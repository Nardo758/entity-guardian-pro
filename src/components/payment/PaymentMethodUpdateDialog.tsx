import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getFreshStripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethodUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const PaymentForm: React.FC<{ onSuccess: (paymentMethodId: string) => void; onClose: () => void; }> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError('Stripe is not ready. Please try again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment details are incomplete.');
        setSubmitting(false);
        return;
      }

      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/billing',
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Failed to confirm payment method');
        toast.error(confirmError.message || 'Failed to confirm payment method');
      } else if (setupIntent?.payment_method) {
        await onSuccess(setupIntent.payment_method as string);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{ layout: 'tabs' }}
      />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={!stripe || !elements || submitting}>
        {submitting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Save Payment Method
          </span>
        )}
      </Button>
    </form>
  );
};

export const PaymentMethodUpdateDialog: React.FC<PaymentMethodUpdateDialogProps> = ({ open, onClose, onUpdated }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSetupIntent = async () => {
      if (!open) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('create-billing-setup-intent');
        if (error) throw error;
        setClientSecret(data?.clientSecret ?? null);
        if (!data?.clientSecret) {
          throw new Error('Failed to initialize payment form');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize payment form';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSetupIntent();
  }, [open]);

  const handleSuccess = async (paymentMethodId: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-payment-method', {
        body: { payment_method_id: paymentMethodId },
      });
      if (error) throw error;
      toast.success('Payment method updated');
      onUpdated();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save payment method';
      toast.error(message);
      setError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment Method</DialogTitle>
          <DialogDescription>
            Enter your new card details. Your future invoices will use this payment method.
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Initializing payment form...
          </div>
        )}
        {!loading && error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && clientSecret && (
          <Elements
            stripe={getFreshStripePromise()}
            options={{ clientSecret, appearance: { theme: 'stripe' } }}
          >
            <PaymentForm onSuccess={handleSuccess} onClose={onClose} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};
