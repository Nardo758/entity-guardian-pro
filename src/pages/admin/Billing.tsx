import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  Search, 
  MoreHorizontal,
  Eye,
  Edit,
  RefreshCw,
  DollarSign,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminBillingManagement, ManagedSubscription, ManagedInvoice } from '@/hooks/useAdminBillingManagement';
import SubscriptionManagementModal from '@/components/admin/SubscriptionManagementModal';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const Billing: React.FC = () => {
  const {
    subscriptions,
    invoices,
    isLoading,
    refetch,
    stats,
    updateSubscription,
    cancelSubscription,
    isUpdating,
  } = useAdminBillingManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<ManagedSubscription | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        sub.email.toLowerCase().includes(searchLower) ||
        sub.owner_name.toLowerCase().includes(searchLower);

      const matchesTier =
        tierFilter === 'all' ||
        sub.subscription_tier === tierFilter;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && sub.subscribed && !sub.cancel_at_period_end) ||
        (statusFilter === 'trial' && sub.is_trial_active) ||
        (statusFilter === 'canceling' && sub.cancel_at_period_end) ||
        (statusFilter === 'inactive' && !sub.subscribed && !sub.is_trial_active);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [subscriptions, searchQuery, tierFilter, statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        searchQuery === '' ||
        inv.owner_email.toLowerCase().includes(searchLower) ||
        inv.stripe_invoice_id.toLowerCase().includes(searchLower)
      );
    });
  }, [invoices, searchQuery]);

  const handleOpenModal = (subscription: ManagedSubscription) => {
    setSelectedSubscription(subscription);
    setModalOpen(true);
  };

  const getStatusBadge = (sub: ManagedSubscription) => {
    if (sub.cancel_at_period_end) {
      return <Badge variant="outline" className="text-warning border-warning">Canceling</Badge>;
    }
    if (sub.subscribed) {
      return <Badge variant="default">Active</Badge>;
    }
    if (sub.is_trial_active) {
      return <Badge variant="secondary">Trial</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing Management</h1>
          <p className="text-muted-foreground">Manage subscriptions and billing</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing Management</h1>
          <p className="text-muted-foreground">Manage subscriptions and billing</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold">{stats.totalSubscribers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Trials</p>
                <p className="text-2xl font-bold">{stats.trialsActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-3">Subscription Tiers</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.byTier).map(([tier, count]) => (
              <div key={tier} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="capitalize font-medium">{tier}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Subscriptions and Invoices */}
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                All Subscriptions
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                View and manage user subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="canceling">Canceling</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subscriptions Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subscriber</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Entities</TableHead>
                      <TableHead>Period End</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No subscriptions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.owner_name}</p>
                              <p className="text-xs text-muted-foreground">{sub.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {sub.subscription_tier || 'free'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(sub)}</TableCell>
                          <TableCell>{sub.entities_limit || 4}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {sub.current_period_end
                              ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenModal(sub)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenModal(sub)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Subscription
                                </DropdownMenuItem>
                                {sub.subscribed && !sub.cancel_at_period_end && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => cancelSubscription(sub.id)}
                                      className="text-destructive"
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Cancel Subscription
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoices
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                View all invoices and payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Invoices Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>
                            <span className="font-mono text-xs">
                              {inv.stripe_invoice_id.slice(0, 20)}...
                            </span>
                          </TableCell>
                          <TableCell>{inv.owner_email}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(inv.amount_due)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={inv.status === 'paid' ? 'default' : 'secondary'}
                            >
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(inv.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {inv.hosted_invoice_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(inv.hosted_invoice_url!, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              {inv.invoice_pdf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(inv.invoice_pdf!, '_blank')}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription Management Modal */}
      <SubscriptionManagementModal
        subscription={selectedSubscription}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={(subscriberId, updates) => updateSubscription({ subscriberId, updates })}
        onCancel={cancelSubscription}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default Billing;
