import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, CreditCard, RefreshCw, AlertCircle, 
  TrendingUp, TrendingDown, Search, Filter, 
  CheckCircle, XCircle, Clock, Plus
} from 'lucide-react';
import { useFinancialAdjustments } from '@/hooks/useFinancialAdjustments';

const FinancialManagementPanel = () => {
  const { 
    adjustments, 
    loading, 
    createAdjustment, 
    updateAdjustmentStatus, 
    processRefund, 
    applyCreditToAccount,
    getPendingAdjustments,
    getTotalAdjustmentsByType
  } = useFinancialAdjustments();

  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    userId: '',
    type: 'refund' as 'refund' | 'credit' | 'debit' | 'fee_waiver',
    amount: '',
    reason: '',
    referencePaymentId: ''
  });

  const filteredAdjustments = adjustments.filter(adj =>
    adj.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.adjustment_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAdjustment = async () => {
    if (newAdjustment.userId && newAdjustment.amount && newAdjustment.reason) {
      await createAdjustment(
        newAdjustment.userId,
        newAdjustment.type,
        parseFloat(newAdjustment.amount),
        newAdjustment.reason,
        newAdjustment.referencePaymentId || undefined
      );
      setCreateDialogOpen(false);
      setNewAdjustment({
        userId: '',
        type: 'refund',
        amount: '',
        reason: '',
        referencePaymentId: ''
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'processed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Processed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'refund':
        return <Badge className="bg-purple-100 text-purple-800">Refund</Badge>;
      case 'credit':
        return <Badge className="bg-green-100 text-green-800">Credit</Badge>;
      case 'debit':
        return <Badge className="bg-red-100 text-red-800">Debit</Badge>;
      case 'fee_waiver':
        return <Badge className="bg-blue-100 text-blue-800">Fee Waiver</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const pendingAdjustments = getPendingAdjustments();
  const totalRefunds = getTotalAdjustmentsByType('refund');
  const totalCredits = getTotalAdjustmentsByType('credit');
  const totalDebits = getTotalAdjustmentsByType('debit');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Financial Management</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search adjustments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Adjustment
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Financial Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Actions</p>
                <p className="text-2xl font-bold">{pendingAdjustments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Refunds</p>
                <p className="text-2xl font-bold">${(totalRefunds / 100).toLocaleString()}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                <p className="text-2xl font-bold">${(totalCredits / 100).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
                <p className="text-2xl font-bold">${(totalDebits / 100).toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell className="font-mono text-sm">
                    {adjustment.user_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{getTypeBadge(adjustment.adjustment_type)}</TableCell>
                  <TableCell className="font-semibold">
                    ${(adjustment.amount / 100).toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {adjustment.reason}
                  </TableCell>
                  <TableCell>{getStatusBadge(adjustment.status)}</TableCell>
                  <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {adjustment.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAdjustmentStatus(adjustment.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAdjustmentStatus(adjustment.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {adjustment.status === 'approved' && adjustment.adjustment_type === 'refund' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => processRefund(adjustment.id)}
                        >
                          Process
                        </Button>
                      )}
                      {adjustment.status === 'approved' && adjustment.adjustment_type === 'credit' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyCreditToAccount(adjustment.id)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Adjustment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Financial Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                value={newAdjustment.userId}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, userId: e.target.value })}
                placeholder="Enter user ID..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select
                value={newAdjustment.type}
                onValueChange={(value: any) => setNewAdjustment({ ...newAdjustment, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="fee_waiver">Fee Waiver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Amount (in cents)</label>
              <Input
                type="number"
                value={newAdjustment.amount}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, amount: e.target.value })}
                placeholder="Enter amount in cents..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={newAdjustment.reason}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, reason: e.target.value })}
                placeholder="Enter reason for adjustment..."
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Reference Payment ID (optional)</label>
              <Input
                value={newAdjustment.referencePaymentId}
                onChange={(e) => setNewAdjustment({ ...newAdjustment, referencePaymentId: e.target.value })}
                placeholder="Enter payment ID if applicable..."
              />
            </div>
            
            <Button 
              onClick={handleCreateAdjustment}
              className="w-full"
              disabled={!newAdjustment.userId || !newAdjustment.amount || !newAdjustment.reason}
            >
              Create Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialManagementPanel;