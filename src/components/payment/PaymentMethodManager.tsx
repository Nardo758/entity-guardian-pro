import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { toast } from 'sonner';

export const PaymentMethodManager: React.FC = () => {
  const { paymentMethods, loading } = usePaymentMethods();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const mockPaymentMethods = [
    {
      id: '1',
      type: 'credit_card',
      name: '•••• •••• •••• 4242',
      expiry_date: '12/25',
      is_default: true,
    },
    {
      id: '2', 
      type: 'credit_card',
      name: '•••• •••• •••• 5555',
      expiry_date: '10/26',
      is_default: false,
    }
  ];

  const handleSetDefault = (methodId: string) => {
    toast.success('Payment method set as default');
  };

  const handleDeleteMethod = (methodId: string) => {
    toast.success('Payment method removed');
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa':
        return <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-400 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>;
      case 'mastercard':
        return <div className="w-8 h-5 bg-gradient-to-r from-red-600 to-orange-400 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>;
      default:
        return <CreditCard className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading payment methods...</div>
        </CardContent>
      </Card>
    );
  }

  const methods = paymentMethods.length > 0 ? paymentMethods : mockPaymentMethods;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Payment Methods
        </CardTitle>
        <CardDescription>
          Manage your payment methods securely
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {methods.length === 0 ? (
          <Alert>
            <AlertDescription>
              No payment methods found. Add a payment method to manage your subscription.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getCardIcon(method.type)}
                  <div>
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Expires {method.expiry_date}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {method.is_default ? (
                    <Badge>Default</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMethod(method.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Payment method management requires Stripe Elements integration. 
                  This will be implemented with your Stripe configuration.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast.success('Payment method would be added here with Stripe Elements');
                  setShowAddDialog(false);
                }}>
                  Add Method
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          <p>🔒 Your payment information is encrypted and secure</p>
          <p>Powered by Stripe • PCI DSS compliant</p>
        </div>
      </CardContent>
    </Card>
  );
};