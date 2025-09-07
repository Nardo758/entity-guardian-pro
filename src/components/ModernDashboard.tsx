import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Calendar, 
  Users, 
  Settings, 
  Crown,
  DollarSign,
  AlertTriangle,
  Menu
} from 'lucide-react';
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
import { SecurityWarningBanner } from './SecurityWarningBanner';
import { TeamSwitcher } from './TeamSwitcher';
import { useEntities } from '@/hooks/useEntities';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeams } from '@/hooks/useTeams';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { stateRequirements } from '@/lib/state-requirements';

const ModernDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  
  const { entities, addEntity, deleteEntity } = useEntities();
  const { payments } = usePayments();
  const { paymentMethods } = usePaymentMethods();
  const { notifications, markAsRead } = useNotifications();
  const { currentTeam } = useTeams();
  const { subscription } = useSubscription();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAddEntity = async (entityData: any) => {
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
  const metrics = {
    totalEntities: entities.length,
    delawareEntities: entities.filter(e => e.state === 'DE').length,
    annualEntityFees: entities.reduce((sum, e) => sum + (stateRequirements[e.state]?.[e.type]?.fee || 0), 0),
    annualServiceFees: entities.reduce((sum, e) => 
      sum + (e.registered_agent_fee || 0) + (e.independent_director_fee || 0), 0),
    pendingPayments: payments.filter(p => p.status === 'pending' || p.status === 'scheduled')
      .reduce((sum, p) => sum + p.amount, 0)
  };

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', current: true },
    { name: 'Entities', icon: Building, path: '/entities' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Payments', icon: CreditCard, path: '/payments' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Find Agents', icon: Users, path: '/find-agents' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  if (isAdmin) {
    navigationItems.push({ name: 'Admin', icon: Crown, path: '/admin-dashboard' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-2.5 shadow-lg">
              <Building className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Entity Renewal Pro</h1>
              <p className="text-xs text-muted-foreground">Business Management</p>
            </div>
          </div>

          {/* Team Switcher */}
          <div className="p-4 border-b border-border">
            <TeamSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                  item.current 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Subscription Status */}
          <div className="p-4 border-t border-border">
            {subscription.subscribed ? (
              <div className="bg-success/10 border border-success/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-success"></div>
                  <span className="text-sm font-medium text-success">
                    {subscription.subscription_tier} Plan
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs border-success/30 text-success hover:bg-success hover:text-success-foreground"
                  onClick={() => navigate('/billing')}
                >
                  Manage Plan
                </Button>
              </div>
            ) : (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-warning"></div>
                  <span className="text-sm font-medium text-warning">No Subscription</span>
                </div>
                <Button 
                  size="sm" 
                  className="w-full bg-primary hover:bg-primary-dark text-xs"
                  onClick={() => navigate('/billing')}
                >
                  Choose Plan
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
                <p className="text-sm text-muted-foreground">Welcome back to your business overview</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <EnhancedNotificationBanner />
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="bg-primary hover:bg-primary-dark shadow-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entity
              </Button>
              <UserAccount />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 space-y-6">
          {/* Security Warning */}
          <SecurityWarningBanner />

          {/* Notifications */}
          <NotificationBanner 
            notifications={notifications.filter(n => !n.read)}
            onDismiss={dismissNotification}
          />

          {/* Entity Form */}
          {showAddForm && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
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
              backgroundColor="bg-primary/5"
            />
            <MetricsCard
              title="Annual Entity Fees"
              value={`$${metrics.annualEntityFees.toFixed(2)}`}
              subtitle="State filing fees"
              icon={DollarSign}
              iconColor="text-success"
              backgroundColor="bg-success/5"
            />
            <MetricsCard
              title="Annual Service Fees"
              value={`$${metrics.annualServiceFees.toFixed(2)}`}
              subtitle="Registered agents & directors"
              icon={Users}
              iconColor="text-info"
              backgroundColor="bg-info/5"
            />
            <MetricsCard
              title="Pending Payments"
              value={`$${metrics.pendingPayments.toFixed(2)}`}
              subtitle="Requires attention"
              icon={AlertTriangle}
              iconColor="text-warning"
              backgroundColor="bg-warning/5"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowScheduleView(true)}
                className="h-auto p-4 justify-start"
              >
                <Calendar className="mr-3 h-5 w-5 text-info" />
                <div className="text-left">
                  <div className="font-medium">View Calendar</div>
                  <div className="text-sm text-muted-foreground">Upcoming renewals</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/payments')}
                className="h-auto p-4 justify-start"
              >
                <CreditCard className="mr-3 h-5 w-5 text-success" />
                <div className="text-left">
                  <div className="font-medium">Payment History</div>
                  <div className="text-sm text-muted-foreground">Manage payments</div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/find-agents')}
                className="h-auto p-4 justify-start"
              >
                <Users className="mr-3 h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Find Agents</div>
                  <div className="text-sm text-muted-foreground">Registered agents</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Entity Cards */}
          {entities.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Your Entities</h3>
              <div className="space-y-4">
                {entities.map((entity) => (
                  <SimpleEntityCard 
                    key={entity.id} 
                    entity={entity} 
                    onDelete={handleDeleteEntity}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Entities Yet</h3>
              <p className="text-muted-foreground mb-4">Get started by adding your first business entity</p>
              <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary-dark">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Entity
              </Button>
            </div>
          )}
        </main>

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

export default ModernDashboard;