import React, { useState } from 'react';
import { Building, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MetricsGrid } from './MetricsGrid';
import { EntityList } from './EntityList';
import { EntityForm } from './EntityForm';
import { PaymentModal } from './PaymentModal';
import { ScheduleModal } from './ScheduleModal';
import { NotificationBanner } from './NotificationBanner';
import { UserAccount } from './UserAccount';
import { useEntities } from '@/hooks/useEntities';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useNotifications } from '@/hooks/useNotifications';
import { stateRequirements } from '@/lib/state-requirements';

const EntityRenewalPro = () => {
  const navigate = useNavigate();
  
  // Use hooks for data management
  const { entities, addEntity, deleteEntity } = useEntities();
  const { payments } = usePayments();
  const { paymentMethods } = usePaymentMethods();
  const { notifications, markAsRead } = useNotifications();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock subscription data - in real app this would come from the profile
  const mockSubscription = {
    status: 'active',
    billingCycle: 'monthly',
    nextBilling: '2025-08-08',
    amount: 99
  };

  const handleAddEntity = async (entityData: any) => {
    try {
      await addEntity(entityData);
      setShowAddForm(false);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleDeleteEntity = async (id: string) => {
    try {
      await deleteEntity(id);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  // Calculate metrics
  const metrics = {
    totalEntities: entities.length,
    delawareEntities: entities.filter(e => e.state === 'DE').length,
    annualEntityFees: entities.reduce((sum, e) => sum + stateRequirements[e.state][e.type].fee, 0),
    annualServiceFees: entities.reduce((sum, e) => 
      sum + (e.registered_agent_fee || 0) + (e.independent_director_fee || 0), 0),
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
                  Manage your business entities and renewals
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

              <UserAccount />

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/payments')}
                  className="bg-success/10 border-success/20 text-success hover:bg-success hover:text-white transition-all duration-300 hover:shadow-md hover:scale-105"
                >
                  💳 Payment History
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
        {mockSubscription.status === 'active' && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-success-muted to-success-muted/50 border border-success/20 p-6 shadow-modern animate-fade-up backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-success to-success animate-pulse"></div>
                <span className="font-semibold text-success text-lg">
                  Starter Plan Active
                </span>
              </div>
              <div className="text-success font-medium">
                Next billing: {new Date(mockSubscription.nextBilling).toLocaleDateString()} 
                <span className="ml-2 px-3 py-1 bg-success/20 rounded-full text-sm text-success">
                  ${mockSubscription.amount}/{mockSubscription.billingCycle}
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
              onClose={() => setShowAddForm(false)}
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