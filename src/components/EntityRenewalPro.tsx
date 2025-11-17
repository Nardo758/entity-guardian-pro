import React, { useState } from 'react';
import { Building, Plus, CreditCard, Calendar, FileText, Users, AlertTriangle, DollarSign, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EntityForm } from './EntityForm';
import { PaymentModal } from './PaymentModal';
import { ScheduleModal } from './ScheduleModal';
import { NotificationBanner } from './NotificationBanner';
import { EnhancedNotificationBanner } from './EnhancedNotificationBanner';
import { UserAccount } from './UserAccount';
import { MetricsCard } from './MetricsCard';
import { SimpleEntityCard } from './SimpleEntityCard';
import { useEntities } from '@/hooks/useEntities';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeams } from '@/hooks/useTeams';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { SecurityWarningBanner } from './SecurityWarningBanner';
import { stateRequirements } from '@/lib/state-requirements';
import { TeamSwitcher } from './TeamSwitcher';
import NavigationMenu from './NavigationMenu';

const EntityRenewalPro = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  
  const { entities, addEntity, deleteEntity } = useEntities();
  const { payments } = usePayments();
  const { paymentMethods } = usePaymentMethods();
  const { notifications, markAsRead } = useNotifications();
  const { currentTeam } = useTeams();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Use actual subscription data
  const { subscription } = useSubscription();

  const handleAddEntity = async (entityData: any) => {
    try {
      // Add team_id if we're in a team context
      const entityWithTeam = {
        ...entityData,
        team_id: currentTeam?.id || null
      };
      await addEntity(entityWithTeam);
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Clean Header */}
        <div className="mb-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary rounded-xl p-3">
                <Building className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Entity Renewal Pro
                </h1>
                <p className="text-muted-foreground">
                  Manage your business entities and renewals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NavigationMenu />
              <TeamSwitcher />
              <EnhancedNotificationBanner />
              <UserAccount />

            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate('/find-agents')}
                className="text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
              >
                <Users className="mr-2 h-4 w-4" />
                Find Agents
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin-dashboard')}
                  className="text-purple-600 border-purple-600/20 hover:bg-purple-600 hover:text-white"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin-setup')}
                className="text-purple-600 border-purple-600/20 hover:bg-purple-600 hover:text-white"
              >
                <Crown className="mr-2 h-4 w-4" />
                Admin Setup
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => navigate('/payments')}
                  className="text-success border-success/20 hover:bg-success hover:text-success-foreground"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payment History
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduleView(true)}
                  className="text-info border-info/20 hover:bg-info hover:text-info-foreground"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entity
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Warning Banner */}
        <div className="mb-6">
          <SecurityWarningBanner />
        </div>

        {/* Subscription Status Banner */}
        {subscription.subscribed && subscription.subscription_tier && (
          <div className="mb-8 bg-success-muted border border-success/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success"></div>
                <span className="font-medium text-success">
                  {subscription.subscription_tier} Plan Active
                </span>
              </div>
              <div className="text-sm text-success">
                {subscription.subscription_end && (
                  <>
                    Next billing: {new Date(subscription.subscription_end).toLocaleDateString('en-US', { 
                      month: 'numeric', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-3 text-xs border-success/30 text-success hover:bg-success hover:text-success-foreground"
                  onClick={() => navigate('/billing')}
                >
                  Manage Plan
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* No Subscription Banner */}
        {(!subscription.subscribed || !subscription.subscription_tier) && (
          <div className="mb-8 bg-warning-muted border border-warning/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning"></div>
                <span className="font-medium text-warning">
                  No Active Subscription
                </span>
                <span className="text-sm text-warning/80">
                  • Limited to 3 entities
                </span>
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary-dark"
                onClick={() => navigate('/billing')}
              >
                Choose Plan
              </Button>
            </div>
          </div>
        )}

        {/* Notifications */}
        <NotificationBanner 
          notifications={notifications.filter(n => !n.read)}
          onDismiss={dismissNotification}
        />

        {/* Entity Form */}
        {showAddForm && (
          <div className="mb-8">
            <EntityForm 
              onSubmit={handleAddEntity}
              onClose={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Active Entities"
            value={metrics.totalEntities}
            subtitle="0 Delaware entities"
            icon={FileText}
            iconColor="text-primary"
            backgroundColor="bg-primary/10"
          />
          <MetricsCard
            title="Annual Entity Fees"
            value={`$${metrics.annualEntityFees.toFixed(2)}`}
            subtitle="Avg. $139 per entity"
            icon={DollarSign}
            iconColor="text-success"
            backgroundColor="bg-success/10"
          />
          <MetricsCard
            title="Annual Service Fees"
            value={`$${metrics.annualServiceFees.toFixed(2)}`}
            subtitle="Registered agents & directors"
            icon={Users}
            iconColor="text-info"
            backgroundColor="bg-info/10"
          />
          <MetricsCard
            title="Pending Payments"
            value={`$${metrics.pendingPayments.toFixed(2)}`}
            subtitle="Requires attention"
            icon={AlertTriangle}
            iconColor="text-warning"
            backgroundColor="bg-warning/10"
          />
        </div>

        {/* Entity Cards */}
        {entities.length > 0 && (
          <div className="space-y-6">
            {entities.map((entity) => (
              <SimpleEntityCard 
                key={entity.id} 
                entity={entity} 
                onDelete={handleDeleteEntity}
              />
            ))}
          </div>
        )}

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