import React, { useState } from 'react';
import { Building, Bell, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricsGrid } from './MetricsGrid';
import { EntityList } from './EntityList';
import { EntityForm } from './EntityForm';
import { PaymentModal } from './PaymentModal';
import { ScheduleModal } from './ScheduleModal';
import { NotificationBanner } from './NotificationBanner';
import { UserAccount } from './UserAccount';
import { Entity, Payment, PaymentMethod, Notification } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

const EntityRenewalPro = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [userAccount] = useState({
    id: 'user_123',
    name: 'John Smith',
    email: 'john@techcorp.com',
    company: 'TechCorp Solutions',
    plan: 'professional',
    subscription: {
      status: 'active',
      billingCycle: 'monthly',
      nextBilling: '2025-08-08',
      amount: 99
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'payment_due',
      title: 'Payment Due Soon',
      message: 'Delaware Corp renewal payment of $175 due in 3 days',
      timestamp: '2025-07-05T10:30:00Z',
      read: false
    },
    {
      id: 2,
      type: 'renewal_reminder',
      title: 'Renewal Reminder',
      message: 'TechCorp LLC renewal due March 1, 2025',
      timestamp: '2025-07-04T14:15:00Z',
      read: true
    }
  ]);

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      type: 'credit_card',
      name: 'Business Visa ****4532',
      isDefault: true,
      expiryDate: '12/26'
    },
    {
      id: 2,
      type: 'bank_account',
      name: 'Business Checking ****7891',
      isDefault: false,
      routingNumber: '****5678'
    }
  ]);

  const [payments] = useState<Payment[]>([
    {
      id: 1,
      entityName: 'TechCorp LLC',
      type: 'Entity Renewal',
      amount: 300,
      dueDate: '2025-03-01',
      status: 'pending',
      paymentMethod: null
    },
    {
      id: 2,
      entityName: 'TechCorp LLC',
      type: 'Registered Agent',
      amount: 150,
      dueDate: '2025-01-15',
      status: 'paid',
      paymentMethod: 'Business Visa ****4532',
      paidDate: '2025-01-10'
    }
  ]);

  const handleAddEntity = (entity: Omit<Entity, 'id'>) => {
    const newEntity = { ...entity, id: Date.now() };
    setEntities([...entities, newEntity]);
    setShowAddForm(false);
  };

  const handleDeleteEntity = (id: number) => {
    setEntities(entities.filter(e => e.id !== id));
  };

  const dismissNotification = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Calculate metrics
  const metrics = {
    totalEntities: entities.length,
    delawareEntities: entities.filter(e => e.state === 'DE').length,
    annualEntityFees: entities.reduce((sum, e) => sum + stateRequirements[e.state][e.type].fee, 0),
    annualServiceFees: entities.reduce((sum, e) => 
      sum + (e.registeredAgent.fee || 0) + (e.independentDirector.fee || 0), 0),
    pendingPayments: payments.filter(p => p.status === 'pending' || p.status === 'scheduled')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-card p-8 shadow-md border border-card-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary-muted p-3">
                <Building className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Entity Renewal Pro
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {userAccount.name} • {userAccount.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </Button>
              </div>

              <UserAccount user={userAccount} />

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-success/10 border-success/20 text-success hover:bg-success hover:text-success-foreground"
                >
                  Payments
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowScheduleView(true)}
                  className="bg-info/10 border-info/20 text-info hover:bg-info hover:text-info-foreground"
                >
                  Schedule
                </Button>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entity
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {userAccount.subscription.status === 'active' && (
          <div className="mb-6 rounded-xl bg-success-muted border border-success/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="font-medium text-success-foreground">
                  {userAccount.plan.charAt(0).toUpperCase() + userAccount.plan.slice(1)} Plan Active
                </span>
              </div>
              <div className="text-sm text-success">
                Next billing: {new Date(userAccount.subscription.nextBilling).toLocaleDateString()} 
                (${userAccount.subscription.amount}/{userAccount.subscription.billingCycle})
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        <NotificationBanner 
          notifications={notifications.filter(n => !n.read)}
          onDismiss={dismissNotification}
        />

        {/* Metrics Grid */}
        <MetricsGrid metrics={metrics} />

        {/* Entity Form */}
        {showAddForm && (
          <EntityForm 
            onSubmit={handleAddEntity}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Entity List */}
        <EntityList 
          entities={entities}
          onDelete={handleDeleteEntity}
        />

        {/* Modals */}
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          payments={payments}
          paymentMethods={paymentMethods}
        />

        <ScheduleModal
          isOpen={showScheduleView}
          onClose={() => setShowScheduleView(false)}
          entities={entities}
        />
      </div>
    </div>
  );
};

export default EntityRenewalPro;