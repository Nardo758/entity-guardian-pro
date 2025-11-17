import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink, Shield, Trash2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export const PaymentMethodManager = () => {
  const { openCustomerPortal } = useSubscription();
  const { paymentMethods, loading, refetch } = usePaymentMethods();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSetDefault = async (stripePaymentMethodId: string) => {
    console.log('handleSetDefault called', stripePaymentMethodId);
    try {
      setBusyId(stripePaymentMethodId);
      toast.loading('Setting as default...', { id: 'set-default' });
      const { data, error } = await supabase.functions.invoke('manage-payment-method', {
        body: { action: 'set_default', payment_method_id: stripePaymentMethodId },
      });
      console.log('set_default response', { data, error });
      if (error) throw error;
      toast.success('Default payment method updated', { id: 'set-default' });
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to set default', { id: 'set-default' });
      console.error('set_default error', e);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (stripePaymentMethodId: string) => {
    console.log('handleRemove called', stripePaymentMethodId);
    try {
      setBusyId(stripePaymentMethodId);
      toast.loading('Removing payment method...', { id: 'remove-pm' });
      const { data, error } = await supabase.functions.invoke('manage-payment-method', {
        body: { action: 'detach', payment_method_id: stripePaymentMethodId },
      });
      console.log('detach response', { data, error });
      if (error) throw error;
      toast.success('Payment method removed', { id: 'remove-pm' });
      await refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove payment method', { id: 'remove-pm' });
      console.error('detach error', e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Manage your payment methods and billing information securely through Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your payment methods are securely managed by Stripe. You can manage them here or via the Stripe Customer Portal.
          </AlertDescription>
        </Alert>

        {/* List methods */}
        <div className="space-y-3">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading payment methods…</div>
          )}
          {!loading && paymentMethods.length === 0 && (
            <div className="text-sm text-muted-foreground">No payment methods yet.</div>
          )}
          {!loading && paymentMethods.map((pm) => (
            <div key={pm.id} className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div className="leading-tight">
                  <div className="font-medium">
                    •••• •••• •••• {pm.card_last4 || '••••'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pm.card_brand || 'Card'} · Expires {pm.card_exp_month?.toString().padStart(2, '0')}/{pm.card_exp_year}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {pm.is_default ? (
                  <Badge variant="secondary">Default</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === pm.stripe_payment_method_id}
                    onClick={() => handleSetDefault(pm.stripe_payment_method_id)}
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={pm.is_default || busyId === pm.stripe_payment_method_id}
                  onClick={() => handleRemove(pm.stripe_payment_method_id)}
                  aria-label="Remove payment method"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={openCustomerPortal} className="w-full" size="lg" variant="outline">
            <CreditCard className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
          <Button onClick={openCustomerPortal} className="w-full" size="sm">
            Manage in Stripe Portal
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Your payment information is securely processed and stored by Stripe, a certified PCI Service Provider Level 1.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
