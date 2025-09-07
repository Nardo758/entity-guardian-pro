import React, { useState } from 'react';
import { Building, Plus, CreditCard, Calendar, FileText, Users, AlertTriangle, DollarSign, Crown, UserCog, BarChart3, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityForm } from './EntityForm';
import { PaymentModal } from './PaymentModal';
import { ScheduleModal } from './ScheduleModal';
import { NotificationBanner } from './NotificationBanner';
import { EnhancedNotificationBanner } from './EnhancedNotificationBanner';
import { UserAccount } from './UserAccount';
import { MetricsCard } from './MetricsCard';
import { SimpleEntityCard } from './SimpleEntityCard';
import AdminRoleManager from './AdminRoleManager';
import SecurityAuditLog from './SecurityAuditLog';
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

const AdminDashboard = () => {
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
  const [activeTab, setActiveTab] = useState('dashboard');

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

  // Redirect if not admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Enhanced Header for Admin */}
        <div className="mb-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-3">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  System-wide administration and oversight
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NavigationMenu />
              <TeamSwitcher />
              <EnhancedNotificationBanner />
              <UserAccount />
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="entities" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                All Entities
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Processing
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Security Warning Banner */}
              <SecurityWarningBanner />

              {/* Subscription Status Banner */}
              {subscription.subscribed && (
                <div className="bg-success-muted border border-success/20 rounded-xl p-4">
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

              {/* Notifications */}
              <NotificationBanner 
                notifications={notifications.filter(n => !n.read)}
                onDismiss={dismissNotification}
              />

              {/* Admin Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entity
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/find-agents')}
                  className="text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Find Agents
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
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/analytics')}
                  className="text-purple-600 border-purple-600/20 hover:bg-purple-600 hover:text-white"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  System Analytics
                </Button>
              </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricsCard
                  title="Active Entities"
                  value={metrics.totalEntities}
                  subtitle={`${metrics.delawareEntities} Delaware entities`}
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
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users">
              <AdminRoleManager />
            </TabsContent>

            {/* All Entities Tab */}
            <TabsContent value="entities">
              <Card>
                <CardHeader>
                  <CardTitle>System-wide Entity Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    View and manage all entities across all customers
                  </p>
                  {entities.length > 0 ? (
                    <div className="space-y-4">
                      {entities.map((entity) => (
                        <SimpleEntityCard 
                          key={entity.id} 
                          entity={entity} 
                          onDelete={handleDeleteEntity}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No entities found in the system
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Processing Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Processing & Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Monitor payments across all customers
                  </p>
                  <Button 
                    onClick={() => navigate('/payments')}
                    className="mb-4"
                  >
                    View All Payments
                  </Button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricsCard
                      title="Total Payments"
                      value={payments.length}
                      subtitle="All time"
                      icon={CreditCard}
                      iconColor="text-success"
                      backgroundColor="bg-success/10"
                    />
                    <MetricsCard
                      title="Pending Payments"
                      value={payments.filter(p => p.status === 'pending').length}
                      subtitle="Requires processing"
                      icon={AlertTriangle}
                      iconColor="text-warning"
                      backgroundColor="bg-warning/10"
                    />
                    <MetricsCard
                      title="Revenue"
                      value={`$${payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}`}
                      subtitle="Total collected"
                      icon={DollarSign}
                      iconColor="text-success"
                      backgroundColor="bg-success/10"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <SecurityAuditLog />
            </TabsContent>
          </Tabs>
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

export default AdminDashboard;