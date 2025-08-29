import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentFormProps {
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  loading?: boolean;
  returnUrl?: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSuccess,
  onError,
  loading = false,
  returnUrl = window.location.origin + '/payment-success'
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log('PaymentForm: stripe ready:', !!stripe);
    console.log('PaymentForm: elements ready:', !!elements);
    console.log('PaymentForm: paymentElement ready:', paymentElementReady);
  }, [stripe, elements, paymentElementReady]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    console.log('PaymentForm handleSubmit called');
    console.log('- stripe:', !!stripe);
    console.log('- elements:', !!elements);
    console.log('- paymentElementReady:', paymentElementReady);

    if (!stripe || !elements) {
      const message = 'Stripe is not ready. Please refresh the page and try again.';
      console.log('PaymentForm: Stripe not ready');
      setErrorMessage(message);
      onError(message);
      return;
    }

    if (!paymentElementReady) {
      const message = 'Payment form is still loading. Please wait a moment and try again.';
      console.log('PaymentForm: PaymentElement not ready');
      setErrorMessage(message);
      onError(message);
      return;
    }

    if (!paymentElementReady) {
      setErrorMessage('Payment element is not ready yet.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
<<<<<<< HEAD
      console.log('PaymentForm: Calling stripe.confirmPayment...');
      
      // Add a small delay to ensure everything is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
=======
      // Ensure elements are complete before confirming
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Payment details are incomplete.');
        onError(submitError.message || 'Payment details are incomplete.');
        setIsProcessing(false);
        return;
      }

>>>>>>> origin/cursor/sync-stripe-pricing-and-products-to-dashboard-6d5a
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('PaymentForm: Stripe error:', error);
        const message = error.message || 'An unexpected error occurred.';
        setErrorMessage(message);
        onError(message);
        toast.error('Payment failed: ' + message);
      } else if (paymentIntent) {
        console.log('PaymentForm: Payment successful:', paymentIntent);
        onSuccess(paymentIntent);
        toast.success('Payment successful!');
      }
    } catch (err: any) {
      console.error('PaymentForm: Exception during payment:', err);
      const message = err.message || 'Payment processing failed';
      setErrorMessage(message);
      onError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {!paymentElementReady && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading payment form...
                </div>
              </div>
            )}
            <PaymentElement 
              onReady={() => {
                console.log('PaymentElement onReady callback fired');
                setPaymentElementReady(true);
              }}
              onLoadError={(error) => {
                console.error('PaymentElement failed to load:', error);
                setErrorMessage('Failed to load payment form. Please refresh and try again.');
                onError('Failed to load payment form');
              }}
              onLoaderStart={() => {
                console.log('PaymentElement loader started');
              }}
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card']
              }}
              onReady={() => {
                console.log('PaymentElement onReady callback fired');
                setPaymentElementReady(true);
              }}
            />
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={!stripe || !elements || !paymentElementReady || isProcessing || loading}
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Payment...
                </div>
              ) : (
                'Complete Payment'
              )}
            </Button>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Your payment information is encrypted and secure.</p>
              <p>Powered by Stripe • PCI DSS compliant</p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};