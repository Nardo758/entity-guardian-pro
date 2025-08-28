import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Download, 
  Plus, 
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Server,
  Database,
  Phone,
  Check,
  Star,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  description: string;
  downloadUrl: string;
}

const Billing = () => {
  const [showPaymentMethodDialog, setShowPaymentMethodDialog] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState('plans');
  const { subscription, loading, createCheckout, openCustomerPortal, checkSubscription } = useSubscription();

  const pricingTiers = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small businesses',
      monthlyPrice: 25,
      yearlyPrice: 249, // 17% discount
      entities: 5,
      features: [
        'Up to 5 entities',
        'Basic notifications',
        'Email support',
        'Standard templates'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Most popular for growing businesses',
      monthlyPrice: 99,
      yearlyPrice: 986, // 17% discount
      entities: 25,
      features: [
        'Up to 25 entities',
        'Advanced notifications',
        'Priority support',
        'API access',
        'Custom reports',
        'Team collaboration'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      monthlyPrice: 200,
      yearlyPrice: 1992, // 17% discount
      entities: 100,
      features: [
        'Up to 100 entities',
        'Advanced notifications',
        'Dedicated support',
        'Full API access',
        'Custom reports',
        'Team collaboration',
        'Priority processing',
        'Custom integrations'
      ],
      popular: false
    },
    {
      id: 'unlimited',
      name: 'Unlimited',
      description: 'Enterprise with unlimited entities',
      monthlyPrice: 350,
      yearlyPrice: 3486, // 17% discount
      entities: 'Unlimited',
      features: [
        'Unlimited entities',
        'Advanced notifications',
        'Dedicated account manager',
        'Full API access',
        'Custom reports',
        'Team collaboration',
        'Priority processing',
        'Custom integrations',
        'White label options'
      ],
      popular: false
    }
  ];

  // Mock invoices data
  const invoices: Invoice[] = [
    {
      id: '1',
      invoiceNumber: 'INV-2024-001',
      date: '2024-08-15',
      dueDate: '2024-08-30',
      amount: 99.99,
      status: 'Paid',
      description: 'Professional Plan - Monthly',
      downloadUrl: '#'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Pending': case 'Past Due': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Draft': case 'Cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleDownload = (invoice: Invoice) => {
    toast.success(`Downloading ${invoice.invoiceNumber}`);
  };

  const handleUpgradeClick = (tier: string) => {
    createCheckout(tier, selectedBilling);
  };

  const handleManageSubscription = () => {
    openCustomerPortal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
              <p className="text-muted-foreground mt-1">Manage your subscription and billing information</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => checkSubscription()}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
              {subscription.subscribed && (
                <Button onClick={handleManageSubscription}>
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Plan</CardTitle>
                  <CardDescription>
                    Select the perfect plan for your business needs
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-4">
                    <Button
                      variant={selectedBilling === 'monthly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBilling('monthly')}
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={selectedBilling === 'yearly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBilling('yearly')}
                    >
                      Yearly
                      <Badge variant="secondary" className="ml-2">Save 17%</Badge>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pricingTiers.map((tier) => (
                      <Card key={tier.id} className={`relative ${tier.popular ? 'border-primary shadow-lg' : ''}`}>
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground">
                              <Star className="w-3 h-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="text-center pb-2">
                          <CardTitle className="text-lg">{tier.name}</CardTitle>
                          <CardDescription className="text-sm">{tier.description}</CardDescription>
                          <div className="mt-4">
                            <div className="text-3xl font-bold">
                              ${selectedBilling === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              per {selectedBilling === 'monthly' ? 'month' : 'year'}
                            </div>
                            {selectedBilling === 'yearly' && (
                              <div className="text-xs text-green-600 font-medium">
                                Save ${(tier.monthlyPrice * 12) - tier.yearlyPrice} annually
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="text-center">
                              <div className="text-lg font-semibold">
                                {typeof tier.entities === 'number' ? `${tier.entities} entities` : tier.entities}
                              </div>
                            </div>
                            <ul className="space-y-2 text-sm">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="flex items-center">
                                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            <Button 
                              className="w-full mt-4" 
                              variant={tier.popular ? 'default' : 'outline'}
                              onClick={() => handleUpgradeClick(tier.id)}
                              disabled={loading}
                            >
                              {subscription.subscribed && subscription.subscription_tier === tier.name 
                                ? 'Current Plan' 
                                : 'Choose Plan'
                              }
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                    <Badge variant={subscription.subscribed ? "default" : "secondary"}>
                      {subscription.subscription_tier || 'Free'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {subscription.subscribed ? 'Active' : 'No active subscription'}
                    </div>
                    {subscription.subscription_end && (
                      <p className="text-xs text-muted-foreground">
                        Next billing: {new Date(subscription.subscription_end).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      {subscription.subscribed ? (
                        <Button className="flex-1" onClick={handleManageSubscription}>
                          Manage Subscription
                        </Button>
                      ) : (
                        <Button className="flex-1" onClick={() => setActiveTab('plans')}>
                          Choose Plan
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Period</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${subscription.subscribed ? pricingTiers.find(t => t.name === subscription.subscription_tier)?.monthlyPrice || 0 : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Current month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Plan Features</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {subscription.subscribed ? 
                        pricingTiers.find(t => t.name === subscription.subscription_tier)?.features.length || 0 
                        : 0
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Active features</p>
                  </CardContent>
                </Card>
              </div>

              {subscription.subscribed && (
                <Card>
                  <CardHeader>
                    <CardTitle>Plan Features</CardTitle>
                    <CardDescription>
                      Your current {subscription.subscription_tier} plan includes:
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {pricingTiers
                        .find(t => t.name === subscription.subscription_tier)
                        ?.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice History</CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="space-y-4">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-sm text-muted-foreground">{invoice.description}</div>
                              <div className="text-sm text-muted-foreground">{invoice.date}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">${invoice.amount}</div>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                              <div className="flex gap-2 mt-2">
                                <Button variant="ghost" size="sm" onClick={() => handleDownload(invoice)}>
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No invoices available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>
                    Track your plan usage and limits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Entities Tracked</span>
                        <span className="text-sm text-muted-foreground">
                          5 / {subscription.subscription_tier === 'Unlimited' ? 'Unlimited' : 
                               pricingTiers.find(t => t.name === subscription.subscription_tier)?.entities || 'N/A'}
                        </span>
                      </div>
                      <Progress value={subscription.subscription_tier === 'Unlimited' ? 10 : 20} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">API Calls</span>
                        <span className="text-sm text-muted-foreground">1,247 / 10,000</span>
                      </div>
                      <Progress value={12.47} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Team Members</span>
                        <span className="text-sm text-muted-foreground">2 / 5</span>
                      </div>
                      <Progress value={40} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Storage Used</span>
                        <span className="text-sm text-muted-foreground">0.5 GB / 5 GB</span>
                      </div>
                      <Progress value={10} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Billing;