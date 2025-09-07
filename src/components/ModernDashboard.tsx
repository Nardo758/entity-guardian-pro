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
  Bell,
  ArrowRight,
  Sparkles,
  Building2
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-xl transform transition-all duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Enhanced Logo Section */}
          <div className="flex items-center gap-4 p-8 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary via-primary-dark to-primary rounded-2xl p-3 shadow-lg ring-1 ring-primary/20">
                <Building className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-card animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <h1 className="font-bold text-xl text-foreground tracking-tight">Entity Renewal Pro</h1>
              <p className="text-sm text-muted-foreground font-medium">Business Management Suite</p>
            </div>
          </div>

          {/* Team Switcher with Enhanced Styling */}
          <div className="p-6 border-b border-border/50 bg-muted/20">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Workspace</label>
              <TeamSwitcher />
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Main Menu</label>
              {navigationItems.slice(0, -1).map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center gap-4 w-full px-4 py-3.5 text-left rounded-2xl transition-all duration-200 font-medium ${
                    item.current 
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${
                    item.current ? 'bg-white/20' : 'group-hover:bg-primary/10'
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">{item.name}</span>
                  {item.current && <ArrowRight className="h-4 w-4 ml-auto opacity-70" />}
                </button>
              ))}
            </div>
            
            {isAdmin && (
              <div className="space-y-2 pt-6 border-t border-border/50">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Administration</label>
                <button
                  onClick={() => {
                    navigate('/admin-dashboard');
                    setSidebarOpen(false);
                  }}
                  className="group flex items-center gap-4 w-full px-4 py-3.5 text-left rounded-2xl transition-all duration-200 font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="p-2 rounded-xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                    <Crown className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Admin Panel</span>
                  <Sparkles className="h-4 w-4 ml-auto opacity-70" />
                </button>
              </div>
            )}
          </nav>

          {/* Enhanced Subscription Status */}
          <div className="p-6 border-t border-border/50">
            {subscription.subscribed ? (
              <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-success shadow-sm"></div>
                    <span className="text-sm font-semibold text-success">
                      {subscription.subscription_tier} Plan
                    </span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-success/60 ml-auto" />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs font-medium border-success/30 text-success hover:bg-success hover:text-success-foreground transition-all duration-200"
                  onClick={() => navigate('/billing')}
                >
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-warning/10 to-destructive/5 border border-warning/20 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-warning shadow-sm animate-pulse"></div>
                    <span className="text-sm font-semibold text-warning">Free Plan</span>
                  </div>
                  <AlertTriangle className="h-4 w-4 text-warning/60 ml-auto" />
                </div>
                <p className="text-xs text-muted-foreground mb-3">Limited to 3 entities</p>
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-xs font-medium shadow-md transition-all duration-200"
                  onClick={() => navigate('/billing')}
                >
                  Upgrade Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Enhanced Top Header */}
        <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 hover:bg-muted/60 rounded-xl"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h2>
                  <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    Live
                  </div>
                </div>
                <p className="text-muted-foreground font-medium">Monitor your business entities and renewals</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <EnhancedNotificationBanner />
                <div className="w-px h-8 bg-border/50"></div>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entity
              </Button>
              <UserAccount />
            </div>
          </div>
        </header>

        {/* Enhanced Main Content Area */}
        <main className="p-4 space-y-4">
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
            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl animate-fade-in">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-1">Add New Entity</h3>
                <p className="text-sm text-muted-foreground">Create a new business entity in your portfolio</p>
              </div>
              <EntityForm 
                onSubmit={handleAddEntity}
                onClose={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Enhanced Metrics Grid - Full Width */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">Business Overview</h3>
                <p className="text-muted-foreground font-medium">Key metrics and performance indicators</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-muted-foreground">Live Data</span>
              </div>
            </div>
            
            {/* Expanded Metrics Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
              <MetricsCard
                title="Active Entities"
                value={metrics.totalEntities}
                subtitle={`${metrics.delawareEntities} Delaware entities • ${entities.length - metrics.delawareEntities} other states`}
                icon={FileText}
                iconColor="text-primary"
                backgroundColor="bg-gradient-to-br from-primary/10 to-primary/5"
              />
              <MetricsCard
                title="Annual Entity Fees"
                value={`$${metrics.annualEntityFees.toFixed(2)}`}
                subtitle={`Avg $${entities.length > 0 ? (metrics.annualEntityFees / entities.length).toFixed(0) : '0'} per entity • State filings`}
                icon={DollarSign}
                iconColor="text-success"
                backgroundColor="bg-gradient-to-br from-success/10 to-success/5"
              />
              <MetricsCard
                title="Service Fees"
                value={`$${metrics.annualServiceFees.toFixed(2)}`}
                subtitle={`Registered agents • Independent directors • Annual total`}
                icon={Users}
                iconColor="text-info"
                backgroundColor="bg-gradient-to-br from-info/10 to-info/5"
              />
              <MetricsCard
                title="Pending Actions"
                value={`$${metrics.pendingPayments.toFixed(2)}`}
                subtitle={`${payments.filter(p => p.status === 'pending').length} payments • Requires attention`}
                icon={AlertTriangle}
                iconColor="text-warning"
                backgroundColor="bg-gradient-to-br from-warning/10 to-warning/5"
              />
            </div>
          </div>

          {/* Two-Column Layout for Better Space Usage */}
          <div className="grid grid-cols-1 2xl:grid-cols-5 gap-6">
            {/* Quick Actions - Larger Section */}
            <div className="2xl:col-span-3">
              <div className="bg-gradient-to-br from-card via-card to-muted/20 border border-border/50 rounded-2xl p-6 shadow-lg h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">Quick Actions</h3>
                    <p className="text-sm text-muted-foreground font-medium">Common tasks and shortcuts</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowScheduleView(true)}
                    className="group h-auto p-4 justify-start bg-card/50 hover:bg-card border-border/50 hover:border-info/30 hover:shadow-lg transition-all duration-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-info/10 group-hover:bg-info/20 rounded-lg transition-colors">
                        <Calendar className="h-4 w-4 text-info" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground group-hover:text-info transition-colors">View Calendar</div>
                        <div className="text-xs text-muted-foreground">Track renewals</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-info ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate('/payments')}
                    className="group h-auto p-4 justify-start bg-card/50 hover:bg-card border-border/50 hover:border-success/30 hover:shadow-lg transition-all duration-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-success/10 group-hover:bg-success/20 rounded-lg transition-colors">
                        <CreditCard className="h-4 w-4 text-success" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground group-hover:text-success transition-colors">Payment Center</div>
                        <div className="text-xs text-muted-foreground">Manage billing</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-success ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate('/find-agents')}
                    className="group h-auto p-4 justify-start bg-card/50 hover:bg-card border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Find Agents</div>
                        <div className="text-xs text-muted-foreground">Connect agents</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/documents')}
                    className="group h-auto p-4 justify-start bg-card/50 hover:bg-card border-border/50 hover:border-purple-500/30 hover:shadow-lg transition-all duration-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-purple-100 group-hover:bg-purple-200 rounded-lg transition-colors">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground group-hover:text-purple-600 transition-colors">Documents</div>
                        <div className="text-xs text-muted-foreground">Manage files</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/analytics')}
                    className="group h-auto p-4 justify-start bg-card/50 hover:bg-card border-border/50 hover:border-orange-500/30 hover:shadow-lg transition-all duration-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-orange-100 group-hover:bg-orange-200 rounded-lg transition-colors">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground group-hover:text-orange-600 transition-colors">Analytics</div>
                        <div className="text-xs text-muted-foreground">View reports</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/settings')}
                    className="group h-auto p-4 justify-start bg-card/50 hover:bg-card border-border/50 hover:border-gray-500/30 hover:shadow-lg transition-all duration-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-gray-100 group-hover:bg-gray-200 rounded-lg transition-colors">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-foreground group-hover:text-gray-600 transition-colors">Settings</div>
                        <div className="text-xs text-muted-foreground">Preferences</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Recent Activity Sidebar */}
            <div className="2xl:col-span-2">
              <div className="bg-gradient-to-br from-card via-card to-muted/10 border border-border/50 rounded-2xl p-6 shadow-lg h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
                    <p className="text-sm text-muted-foreground">Latest updates and actions</p>
                  </div>
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="space-y-4">
                  {entities.slice(0, 3).map((entity, index) => (
                    <div key={entity.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{entity.name}</p>
                        <p className="text-xs text-muted-foreground">Entity created</p>
                      </div>
                      <span className="text-xs text-muted-foreground">Recent</span>
                    </div>
                  ))}
                  
                  {entities.length === 0 && (
                    <div className="text-center py-8">
                      <div className="p-4 bg-muted/30 rounded-2xl inline-flex mb-3">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                      <p className="text-xs text-muted-foreground">Start by adding your first entity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Entity Cards Section - Full Width */}
          {entities.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Entity Portfolio</h3>
                  <p className="text-sm text-muted-foreground font-medium">{entities.length} active business entities</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="font-medium"
                  onClick={() => navigate('/entities')}
                >
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid gap-4">
                {entities.map((entity, index) => (
                  <div 
                    key={entity.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <SimpleEntityCard 
                      entity={entity} 
                      onDelete={handleDeleteEntity}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-card via-muted/20 to-card border border-border/50 rounded-2xl p-8 text-center shadow-lg">
              <div className="max-w-lg mx-auto space-y-6">
                <div className="relative">
                  <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-6 inline-flex">
                    <Building className="h-12 w-12 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                    <Plus className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Welcome to Entity Renewal Pro</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Start managing your business entities efficiently. Add your first entity to track renewals, fees, and compliance requirements.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button 
                    onClick={() => setShowAddForm(true)} 
                    className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg font-semibold"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Entity
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/find-agents')}
                    className="font-medium"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Find Registered Agent
                  </Button>
                </div>
              </div>
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