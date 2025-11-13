import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, ExternalLink, Shield } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export const PaymentMethodManager = () => {
  const { openCustomerPortal } = useSubscription();

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
            Your payment methods are securely managed by Stripe. Click below to access the secure portal where you can add, update, or remove payment methods.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={openCustomerPortal}
            className="w-full"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Manage Payment Methods
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>In the Stripe Customer Portal, you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Add new payment methods</li>
              <li>Update existing cards</li>
              <li>Set a default payment method</li>
              <li>Remove old payment methods</li>
              <li>View payment history</li>
            </ul>
          </div>
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
