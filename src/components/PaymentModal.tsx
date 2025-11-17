import React, { useState } from 'react';
import { CreditCard, CheckCircle, AlertTriangle, Calendar, DollarSign, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment, PaymentMethod } from '@/types/entity';
import { usePayments } from '@/hooks/usePayments';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  paymentMethods: PaymentMethod[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  payments,
  paymentMethods
}) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { updatePaymentStatus } = usePayments();

  const getPaymentStatus = (payment: Payment) => {
    const today = new Date();
    const dueDate = new Date(payment.due_date);

    if (payment.status === 'paid') {
      return { 
        color: 'bg-success-muted text-success border-success/20', 
        text: 'Paid', 
        icon: CheckCircle 
      };
    } else if (payment.status === 'scheduled') {
      return { 
        color: 'bg-primary-muted text-primary border-primary/20', 
        text: 'Scheduled', 
        icon: Calendar 
      };
    } else if (dueDate < today) {
      return { 
        color: 'bg-destructive-muted text-destructive border-destructive/20', 
        text: 'Overdue', 
        icon: AlertTriangle 
      };
    } else {
      return { 
        color: 'bg-warning-muted text-warning border-warning/20', 
        text: 'Pending', 
        icon: DollarSign 
      };
    }
  };

  const processPayment = async (paymentId: string, paymentMethodId: string) => {
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (paymentMethod) {
      try {
        await updatePaymentStatus(paymentId, 'paid', paymentMethodId);
        setSelectedPayment(null);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const paidThisYear = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const scheduledPayments = payments
    .filter(p => p.status === 'scheduled')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-success" />
              Payment Management
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-success-muted border-success/20">
                <CardContent className="p-4">
                  <div className="text-lg font-bold text-success">
                    ${paidThisYear.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Paid This Year</div>
                </CardContent>
              </Card>
              <Card className="bg-warning-muted border-warning/20">
                <CardContent className="p-4">
                  <div className="text-lg font-bold text-warning">
                    ${pendingPayments.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Payments</div>
                </CardContent>
              </Card>
              <Card className="bg-primary-muted border-primary/20">
                <CardContent className="p-4">
                  <div className="text-lg font-bold text-primary">
                    ${scheduledPayments.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Scheduled Payments</div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3">Payment Methods</h4>
                <div className="space-y-2">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {method.card_brand || 'Card'} •••• {method.card_last4 || '••••'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Expires {method.card_exp_month?.toString().padStart(2, '0')}/{method.card_exp_year}
                          </div>
                        </div>
                      </div>
                      {method.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="text-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payments List */}
            <div>
              <h4 className="font-semibold mb-3">Recent Payments & Due Items</h4>
              <div className="space-y-3">
                {payments.map(payment => {
                  const status = getPaymentStatus(payment);
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={payment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium">{payment.entity_name}</h5>
                              <span className="text-sm text-muted-foreground">- {payment.type}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Due: {new Date(payment.due_date).toLocaleDateString()} • ${payment.amount.toLocaleString()}
                            </div>
                            {payment.payment_method && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {payment.status === 'paid' ? 'Paid' : 'Scheduled'} via {payment.payment_method}
                                {payment.paid_date && ` on ${new Date(payment.paid_date).toLocaleDateString()}`}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={`${status.color} flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.text}
                            </Badge>
                            {payment.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedPayment(payment)}
                                className="bg-success hover:bg-success/90 text-success-foreground"
                              >
                                Pay Now
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Processing Modal */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="font-medium">{selectedPayment.entity_name}</div>
                  <div className="text-sm text-muted-foreground">{selectedPayment.type}</div>
                  <div className="text-lg font-bold text-success">
                    ${selectedPayment.amount.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method:</label>
                <Select defaultValue={paymentMethods.find(pm => pm.is_default)?.id.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method.id} value={method.id.toString()}>
                        {method.card_brand || 'Card'} •••• {method.card_last4 || '••••'} {method.is_default ? '(Default)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const paymentMethodId = paymentMethods.find(pm => pm.is_default)?.id || paymentMethods[0]?.id;
                    if (paymentMethodId) {
                      processPayment(selectedPayment.id, paymentMethodId);
                    }
                  }}
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                >
                  Process Payment
                </Button>
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};