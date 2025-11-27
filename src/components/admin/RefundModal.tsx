import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CreditCard, ExternalLink, Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: any[];
}

export const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, invoices }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.amount_paid > 0);
  
  const filteredInvoices = paidInvoices.filter(inv =>
    inv.stripe_invoice_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvoiceSelect = (invoice: any) => {
    setSelectedInvoice(invoice);
    setRefundAmount((invoice.amount_paid / 100).toFixed(2));
    setRefundType('full');
  };

  const handleRefundTypeChange = (type: 'full' | 'partial') => {
    setRefundType(type);
    if (type === 'full' && selectedInvoice) {
      setRefundAmount((selectedInvoice.amount_paid / 100).toFixed(2));
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedInvoice) {
      toast.error('Please select an invoice to refund');
      return;
    }

    const amount = parseFloat(refundAmount);
    const maxAmount = selectedInvoice.amount_paid / 100;

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    if (amount > maxAmount) {
      toast.error(`Refund amount cannot exceed $${maxAmount.toFixed(2)}`);
      return;
    }

    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    setLoading(true);
    try {
      // In production, this would call a Stripe refund edge function
      // For now, we'll open Stripe dashboard with the payment
      const stripeUrl = `https://dashboard.stripe.com/payments/${selectedInvoice.stripe_invoice_id?.replace('in_', 'pi_')}`;
      
      toast.success(
        'Opening Stripe Dashboard for refund processing',
        { 
          description: `Refund $${amount.toFixed(2)} for invoice ${selectedInvoice.stripe_invoice_id}`,
          action: {
            label: 'Open Stripe',
            onClick: () => window.open(stripeUrl, '_blank')
          }
        }
      );

      // Log the refund request
      console.log('Refund request:', {
        invoice_id: selectedInvoice.stripe_invoice_id,
        customer_id: selectedInvoice.stripe_customer_id,
        amount: amount * 100, // Convert to cents
        reason: refundReason,
        type: refundType
      });

      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Refund error:', error);
      toast.error(error.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedInvoice(null);
    setRefundAmount('');
    setRefundReason('');
    setRefundType('full');
    setSearchTerm('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Process Refund
          </DialogTitle>
          <DialogDescription>
            Select a paid invoice and specify the refund details. Refunds are processed through Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Invoice Selection */}
          <div className="space-y-2">
            <Label>Search Invoices</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Invoice List */}
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
            {filteredInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No paid invoices found
              </p>
            ) : (
              filteredInvoices.slice(0, 10).map((invoice) => (
                <Card
                  key={invoice.id}
                  className={`cursor-pointer transition-colors ${
                    selectedInvoice?.id === invoice.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleInvoiceSelect(invoice)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs">{invoice.stripe_invoice_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${(invoice.amount_paid / 100).toFixed(2)}</p>
                        <Badge variant="default" className="text-xs">Paid</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Refund Details */}
          {selectedInvoice && (
            <div className="space-y-4 pt-4 border-t">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Selected Invoice</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {selectedInvoice.stripe_invoice_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Amount Paid</p>
                      <p className="font-bold text-lg">
                        ${(selectedInvoice.amount_paid / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Refund Type</Label>
                  <Select value={refundType} onValueChange={(v) => handleRefundTypeChange(v as 'full' | 'partial')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Refund</SelectItem>
                      <SelectItem value="partial">Partial Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Refund Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={(selectedInvoice.amount_paid / 100).toFixed(2)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    disabled={refundType === 'full'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Refund Reason *</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter the reason for this refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Important</p>
                  <p className="text-muted-foreground">
                    Refunds will be processed through the Stripe Dashboard. You'll be redirected to complete the refund.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleProcessRefund} 
            disabled={!selectedInvoice || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Process in Stripe
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
