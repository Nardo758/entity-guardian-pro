import React, { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { DashboardHeader } from './DashboardHeader';
import { MetricsGrid } from './MetricsGrid';
import { EntityPortfolio } from './EntityPortfolio';
import { EntityForm } from '@/components/EntityForm';
import { PaymentModal } from '@/components/PaymentModal';
import { ScheduleModal } from '@/components/ScheduleModal';
import { NotificationBanner } from '@/components/NotificationBanner';
import EnhancedNotificationBanner from '@/components/dashboard/EnhancedNotificationBanner';
import { SecurityWarningBanner } from '@/components/SecurityWarningBanner';
import { useEntities } from '@/hooks/useEntities';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useNotifications } from '@/hooks/useNotifications';
import { useAgentNotifications } from '@/hooks/useAgentNotifications';
import { useTeams } from '@/hooks/useTeams';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { stateRequirements } from '@/lib/state-requirements';
import { Entity } from '@/types/entity';
import { Card, CardContent } from '@/components/ui/card';

const ModernDashboard = () => {
  const { isAdmin } = useAdminAccess();
  
  const { entities, addEntity, deleteEntity, loading: entitiesLoading } = useEntities();
  const { payments } = usePayments();
  const { paymentMethods } = usePaymentMethods();
  const { notifications, markAsRead } = useAgentNotifications();
  const { currentTeam } = useTeams();
  const { invitations } = useAgentInvitations();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleAddEntity = async (
    entityData: Omit<Entity, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      const entityWithTeam = {
        ...entityData,
        team_id: currentTeam?.id || null
      };
      await addEntity(entityWithTeam);
      setShowAddForm(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDeleteEntity = async (id: string) => {
    try {
      await deleteEntity(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      // Error handled in hook
    }
  };

  // Calculate metrics
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending').length;
  const activeAgents = invitations.filter(inv => inv.status === 'accepted').length;
  
  const metrics = {
    totalEntities: entities.length,
    delawareEntities: entities.filter(e => e.state === 'DE').length,
    annualEntityFees: entities.reduce((sum, e) => sum + (stateRequirements[e.state]?.[e.type]?.fee || 0), 0),
    annualServiceFees: entities.reduce((sum, e) => 
      sum + (e.registered_agent_fee || 0) + (e.independent_director_fee || 0), 0),
    pendingPayments: payments.filter(p => p.status === 'pending' || p.status === 'scheduled')
      .reduce((sum, p) => sum + p.amount, 0),
    upcomingRenewals: payments.filter(p => p.status === 'pending').length,
    pendingInvitations,
    activeAgents
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Dashboard"
        subtitle="Monitor your business entities and compliance requirements"
        onAddEntity={() => setShowAddForm(true)}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-8">
          {/* Admin Security Alerts */}
          {isAdmin && (
            <div className="space-y-4">
              <SecurityWarningBanner />
            </div>
          )}

          {/* User Notifications */}
          {unreadNotifications.length > 0 && (
            <EnhancedNotificationBanner 
              notifications={unreadNotifications}
              onDismiss={dismissNotification}
            />
          )}

          {/* Entity Form */}
          {showAddForm && (
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground mb-2">Add New Entity</h2>
                  <p className="text-sm text-muted-foreground">
                    Create a new business entity in your portfolio
                  </p>
                </div>
                <EntityForm 
                  onSubmit={handleAddEntity}
                  onClose={() => setShowAddForm(false)}
                />
              </CardContent>
            </Card>
          )}

          {/* Business Overview Metrics */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Business Overview</h2>
              <p className="text-sm text-muted-foreground">
                Key metrics and performance indicators for your portfolio
              </p>
            </div>
            
            <MetricsGrid metrics={metrics} />
          </div>

          {/* Entity Portfolio */}
          <div className="space-y-6">
            <EntityPortfolio
              entities={entities}
              onAddEntity={() => setShowAddForm(true)}
              onDeleteEntity={handleDeleteEntity}
            />
          </div>

          {/* Loading State */}
          {entitiesLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>

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
    </DashboardLayout>
  );
};

export default ModernDashboard;