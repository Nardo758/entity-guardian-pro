import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Lock, 
  Check, 
  Star, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { STRIPE_PRICING_TIERS, getFreshStripePromise } from '@/lib/stripe';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';


// Use the shared Stripe promise from lib

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: string;
  selectedBilling: 'monthly' | 'yearly';
  onSuccess?: () => void;
}

interface PaymentFormProps {
  clientSecret: string;
  selectedTier: string;
  selectedBilling: 'monthly' | 'yearly';
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  clientSecret,
  selectedTier,
  selectedBilling,
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe is not ready. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed. Please try again.');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast.success('Payment successful! Setting up your subscription...');
        onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          Your payment is secured by Stripe
        </div>
        
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Complete Payment
          </>
        )}
      </Button>
    </form>
  );
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedTier,
  selectedBilling,
  onSuccess
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  const tierInfo = STRIPE_PRICING_TIERS[selectedTier as keyof typeof STRIPE_PRICING_TIERS];
  const price = selectedBilling === 'monthly' ? tierInfo?.monthlyPrice : tierInfo?.yearlyPrice;
  const savings = selectedBilling === 'yearly' ? (tierInfo?.monthlyPrice * 12) - tierInfo?.yearlyPrice : 0;

  useEffect(() => {
    if (!isOpen || !user || clientSecret) return;

    createPaymentIntent();
  }, [isOpen, user, selectedTier, selectedBilling]);

  const createPaymentIntent = async () => {
    if (!user) {
      setError('Please log in to subscribe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('create-paid-registration', {
        body: {
          tier: selectedTier,
          billing: selectedBilling,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          company: user.user_metadata?.company || '',
          company_size: user.user_metadata?.company_size || ''
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret returned from payment service');
      }

      setClientSecret(data.clientSecret);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.';
      console.error('Error creating payment intent:', error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Subscription activated successfully!');
    onSuccess?.();
    onClose();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // Reset state when modal closes
      setClientSecret('');
      setError('');
    }
  };

  if (!tierInfo) {
    return null;
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0066cc',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Complete Your Subscription</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={loading}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Subscribe to {tierInfo.name} plan and unlock all features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  {tierInfo.name}
                  {tierInfo.popular && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </span>
                <span className="text-lg font-bold">
                  ${price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{selectedBilling === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {selectedBilling === 'yearly' && savings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                      Annual savings: ${savings}
                    </span>
                    <Badge variant="secondary" className="text-green-600">
                      Save 17%
                    </Badge>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Included features:</div>
                  <div className="space-y-1">
                    {tierInfo.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-muted-foreground">
                        <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                    {tierInfo.features.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{tierInfo.features.length - 3} more features
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Initializing payment...</span>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={getFreshStripePromise()}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                selectedTier={selectedTier}
                selectedBilling={selectedBilling}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </Elements>
          ) : (
            <Button 
              onClick={createPaymentIntent} 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Initialize Payment
            </Button>
          )}

          {/* Security Notice */}
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Secured by Stripe - PCI DSS Level 1 compliant</span>
            </div>
            <div>Your card details are never stored on our servers</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};