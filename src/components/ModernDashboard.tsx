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
  Menu,
  TrendingUp,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EntityForm } from './EntityForm';
import { PaymentModal } from './PaymentModal';
import { ScheduleModal } from './ScheduleModal';
import { NotificationBanner } from './NotificationBanner';
import { EnhancedNotificationBanner } from './EnhancedNotificationBanner';
import { UserAccount } from './UserAccount';
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
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Clean Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-60 bg-background border-r border-border transform transition-all duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="bg-primary rounded-lg p-2">
              <Building className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Entity Renewal Pro</h1>
              <p className="text-xs text-muted-foreground">Business Management Suite</p>
            </div>
          </div>

          {/* Team Switcher */}
          <div className="p-4 border-b border-border">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Workspace</label>
              <TeamSwitcher />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2 block">Main Menu</label>
              {navigationItems.slice(0, -1).map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-left rounded-lg transition-colors font-medium text-sm ${
                    item.current 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
            
            {isAdmin && (
              <div className="space-y-1 pt-4 border-t border-border mt-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2 block">Administration</label>
                <button
                  onClick={() => {
                    navigate('/admin-dashboard');
                    setSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left rounded-lg transition-colors font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Crown className="h-4 w-4" />
                  <span>Admin Panel</span>
                </button>
              </div>
            )}
          </nav>

          {/* Subscription Status */}
          <div className="p-4 border-t border-border">
            {subscription.subscribed ? (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-success"></div>
                  <span className="text-sm font-medium text-success">
                    {subscription.subscription_tier} Plan
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => navigate('/billing')}
                >
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 w-2 rounded-full bg-warning"></div>
                  <span className="text-sm font-medium text-warning">Free Plan</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Limited to 3 entities</p>
                <Button 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => navigate('/billing')}
                >
                  $139.50 Upgrade Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-60">
        {/* Clean Header */}
        <header className="bg-background border-b border-border sticky top-0 z-30">
          <div className="flex items-center justify-between px-6" style={{ paddingTop: '0.2rem', paddingBottom: '0.2rem' }}>
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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
                  <div className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                    Live
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Monitor your business entities and renewals</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <EnhancedNotificationBanner />
              <Button
                onClick={() => setShowAddForm(true)}
                className="font-medium"
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
          {/* Admin-Only Security Alerts */}
          {isAdmin && (
            <div className="space-y-3">
              <SecurityWarningBanner />
            </div>
          )}

          {/* Regular User Notifications */}
          {notifications.filter(n => !n.read).length > 0 && (
            <NotificationBanner 
              notifications={notifications.filter(n => !n.read)}
              onDismiss={dismissNotification}
            />
          )}

          {/* Entity Form */}
          {showAddForm && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Add New Entity</h3>
                <p className="text-sm text-muted-foreground">Create a new business entity in your portfolio</p>
              </div>
              <EntityForm 
                onSubmit={handleAddEntity}
                onClose={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Business Overview Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Business Overview</h3>
              <p className="text-sm text-muted-foreground">Key metrics and performance indicators</p>
            </div>
            
            {/* Compact Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{metrics.totalEntities}</div>
                    <div className="text-sm text-muted-foreground">Active Entities</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {metrics.delawareEntities} Delaware entities • {entities.length - metrics.delawareEntities} other states
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">${metrics.annualEntityFees.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Annual Entity Fees</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Avg ${entities.length > 0 ? (metrics.annualEntityFees / entities.length).toFixed(0) : '0'} per entity • State filings
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <Users className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">${metrics.annualServiceFees.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Service Fees</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Registered agents • Independent directors
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">${metrics.pendingPayments.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Pending Actions</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {payments.filter(p => p.status === 'pending').length} payments • Requires attention
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">Common tasks and shortcuts</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowScheduleView(true)}
                className="h-auto p-3 justify-start flex-col items-center gap-2 text-center"
              >
                <Calendar className="h-5 w-5 text-info" />
                <div className="text-sm font-medium">View Calendar</div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/payments')}
                className="h-auto p-3 justify-start flex-col items-center gap-2 text-center"
              >
                <CreditCard className="h-5 w-5 text-success" />
                <div className="text-sm font-medium">Registered Agent</div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/documents')}
                className="h-auto p-3 justify-start flex-col items-center gap-2 text-center"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Documents</div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/analytics')}
                className="h-auto p-3 justify-start flex-col items-center gap-2 text-center"
              >
                <TrendingUp className="h-5 w-5 text-warning" />
                <div className="text-sm font-medium">Analytics</div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/find-agents')}
                className="h-auto p-3 justify-start flex-col items-center gap-2 text-center"
              >
                <Users className="h-5 w-5 text-info" />
                <div className="text-sm font-medium">Find Agents</div>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/settings')}
                className="h-auto p-3 justify-start flex-col items-center gap-2 text-center"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm font-medium">Settings</div>
              </Button>
            </div>
          </div>

          {/* Entity Portfolio */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Entity Portfolio</h3>
                <p className="text-sm text-muted-foreground">1 active business entities</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {entities.length > 0 ? (
                entities.map((entity) => (
                  <div key={entity.id} className="bg-muted/30 border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{entity.name}</div>
                          <div className="text-sm text-muted-foreground">{entity.type} • {entity.state}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">${(stateRequirements[entity.state]?.[entity.type]?.fee || 0).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">State Fee</div>
                      </div>
                    </div>
                    {entity.registered_agent_fee && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Registered Agent:</span>
                          <div className="mt-1">
                            <div className="font-medium text-foreground">Professional Service</div>
                            <div className="text-xs text-success">${entity.registered_agent_fee}/year</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="p-3 bg-muted/20 rounded-full w-fit mx-auto mb-3">
                    <Building className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No entities found</p>
                  <p className="text-xs text-muted-foreground mt-1">Add your first entity to get started</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="mt-3"
                    size="sm"
                  >
                    Add Entity
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showScheduleView && (
        <ScheduleModal 
          isOpen={showScheduleView}
          onClose={() => setShowScheduleView(false)}
          entities={entities}
        />
      )}
      
      {showPaymentModal && (
        <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          payments={payments}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};

export default ModernDashboard;