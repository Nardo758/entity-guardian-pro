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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface relative">
      {/* Background mesh gradient */}
      <div className="absolute inset-0 bg-[var(--gradient-mesh)] pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-8">
        {/* Modern Header with Glass Effect */}
        <div className="mb-8 rounded-3xl bg-glass backdrop-blur-xl border border-glass-border shadow-modern-lg p-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-4 shadow-glow animate-glow">
                <Building className="h-10 w-10 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent font-display">
                  Entity Renewal Pro
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  Welcome back, <span className="font-semibold text-foreground">{userAccount.name}</span> • {userAccount.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative hover:bg-primary/10 transition-all duration-300">
                  <Bell className="h-5 w-5" />
                   {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white animate-pulse">
                       {notifications.filter(n => !n.read).length}
                     </span>
                   )}
                </Button>
              </div>

              <UserAccount user={userAccount} />

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-success/10 border-success/20 text-success hover:bg-success hover:text-white transition-all duration-300 hover:shadow-md hover:scale-105"
                >
                  💳 Payments
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setShowScheduleView(true)}
                  className="bg-info/10 border-info/20 text-info hover:bg-info hover:text-white transition-all duration-300 hover:shadow-md hover:scale-105"
                >
                  📅 Schedule
                </Button>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:scale-105"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entity
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Status Banner */}
        {userAccount.subscription.status === 'active' && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-success-muted to-success-muted/50 border border-success/20 p-6 shadow-modern animate-fade-up backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-success to-success animate-pulse"></div>
                <span className="font-semibold text-success text-lg">
                  {userAccount.plan.charAt(0).toUpperCase() + userAccount.plan.slice(1)} Plan Active
                </span>
              </div>
              <div className="text-success font-medium">
                Next billing: {new Date(userAccount.subscription.nextBilling).toLocaleDateString()} 
                <span className="ml-2 px-3 py-1 bg-success/20 rounded-full text-sm text-success">
                  ${userAccount.subscription.amount}/{userAccount.subscription.billingCycle}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Modern Notifications */}
        <NotificationBanner 
          notifications={notifications.filter(n => !n.read)}
          onDismiss={dismissNotification}
        />

        {/* Enhanced Metrics Grid */}
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <MetricsGrid metrics={metrics} />
        </div>

        {/* Modern Entity Form */}
        {showAddForm && (
          <div className="animate-scale-in">
            <EntityForm 
              onSubmit={handleAddEntity}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Enhanced Entity List */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <EntityList 
            entities={entities}
            onDelete={handleDeleteEntity}
          />
        </div>

        {/* Enhanced Modals */}
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