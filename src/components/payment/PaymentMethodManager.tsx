import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink, Shield, Trash2, ChevronDown, Calendar, Receipt } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethodUpdateDialog } from './PaymentMethodUpdateDialog';

interface Invoice {
  id: string;
  stripe_invoice_id: string;
  amount_paid: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export const PaymentMethodManager = () => {
  const { user } = useAuth();
  const { openCustomerPortal } = useSubscription();
  const { paymentMethods, loading, refetch } = usePaymentMethods();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<{ id: string; last4: string } | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecentInvoices();
    }
  }, [user]);

  const fetchRecentInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const { data, error } = await supabase
        .from('stripe_invoices')
        .select('id, stripe_invoice_id, amount_paid, currency, status, paid_at, created_at')
        .eq('user_id', user?.id)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

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
      setDeleteConfirmOpen(false);
      setMethodToDelete(null);
    }
  };

  const confirmRemove = () => {
    if (methodToDelete) {
      handleRemove(methodToDelete.id);
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
            <Collapsible key={pm.id} className="rounded-md border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 flex-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="leading-tight flex-1">
                    <div className="font-medium">
                      •••• •••• •••• {pm.card_last4 || '••••'}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{pm.card_brand || 'Card'} · Expires {pm.card_exp_month?.toString().padStart(2, '0')}/{pm.card_exp_year}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Added {format(new Date(pm.created_at), 'MMM d, yyyy')}
                      </span>
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
                    onClick={() => {
                      setMethodToDelete({ id: pm.stripe_payment_method_id, last4: pm.card_last4 || '••••' });
                      setDeleteConfirmOpen(true);
                    }}
                    aria-label="Remove payment method"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Show details">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent>
                <div className="border-t p-4 bg-muted/30">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method ID:</span>
                      <span className="font-mono text-xs">{pm.stripe_payment_method_id.slice(0, 20)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span>{pm.is_default ? 'Default - Used for all charges' : 'Available'}</span>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button onClick={() => setShowUpdateDialog(true)} className="w-full" size="lg" variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
            <Button onClick={openCustomerPortal} className="w-full" size="sm">
              Manage in Stripe Portal
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </div>

        {/* Recent Transactions */}
        {recentInvoices.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">Recent Transactions</h4>
            </div>
            <div className="space-y-2">
              {invoicesLoading ? (
                <div className="text-xs text-muted-foreground">Loading transactions...</div>
              ) : (
                recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between text-xs p-2 rounded-md bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(invoice.paid_at || invoice.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCurrency(invoice.amount_paid, invoice.currency)}
                      </span>
                      <Badge variant="outline" className="text-xs">Paid</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button
              variant="link"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => window.location.href = '/billing'}
            >
              View All Invoices
            </Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Your payment information is securely processed and stored by Stripe, a certified PCI Service Provider Level 1.
          </p>
        </div>
      </CardContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the payment method ending in {methodToDelete?.last4}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              disabled={!!busyId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>

      <PaymentMethodUpdateDialog
        open={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        onUpdated={refetch}
      />
  );
};
