import React, { useState } from 'react';
import { EntityPortfolio } from './EntityPortfolio';
import { EntityForm } from '@/components/EntityForm';
import { PaymentModal } from '@/components/PaymentModal';
import { ScheduleModal } from '@/components/ScheduleModal';
import { NotificationBanner } from '@/components/NotificationBanner';
import { SecurityWarningBanner } from '@/components/SecurityWarningBanner';
import { RealTimeNotifications } from '@/components/RealTimeNotifications';
import { AdvancedComplianceTracker } from '@/components/AdvancedComplianceTracker';
import { useEntities } from '@/hooks/useEntities';
import { usePayments } from '@/hooks/usePayments';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeams } from '@/hooks/useTeams';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { stateRequirements } from '@/lib/state-requirements';
import { Entity } from '@/types/entity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, DollarSign, FileText, Clock, AlertTriangle, 
         TrendingUp, Calendar, CheckCircle2, Plus, MapPin, Users, Settings, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { SidebarTrigger } from '@/components/ui/sidebar';

const ModernDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  
  const { entities, addEntity, deleteEntity, loading: entitiesLoading } = useEntities();
  const { payments } = usePayments();
  const { paymentMethods } = usePaymentMethods();
  const { notifications, markAsRead } = useNotifications();
  const { currentTeam } = useTeams();
  
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
  const totalEntities = entities?.length || 0;
  const pendingPayments = payments?.filter(p => p.status === 'pending')?.length || 0;
  const totalRevenue = payments?.filter(p => p.status === 'paid')
    ?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const delawareEntities = entities?.filter(e => e.state === 'DE')?.length || 0;
  
  const upcomingDeadlines = entities?.filter(entity => {
    const dueDate = entity.registered_agent_fee_due_date;
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }) || [];

  const metrics = {
    totalEntities,
    delawareEntities,
    annualEntityFees: entities.reduce((sum, e) => sum + (stateRequirements[e.state]?.[e.type]?.fee || 0), 0),
    annualServiceFees: entities.reduce((sum, e) => 
      sum + (e.registered_agent_fee || 0) + (e.independent_director_fee || 0), 0),
    pendingPayments: payments.filter(p => p.status === 'pending' || p.status === 'scheduled')
      .reduce((sum, p) => sum + p.amount, 0),
    upcomingRenewals: payments.filter(p => p.status === 'pending').length
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between px-6 py-4 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
              <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                Live
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor your business entities and compliance requirements</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RealTimeNotifications />
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="font-medium shadow-sm"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Add Entity
          </Button>
        </div>
      </div>

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
            <NotificationBanner 
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

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Entities</p>
                    <p className="text-2xl font-bold text-foreground">{totalEntities}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                    <p className="text-2xl font-bold text-foreground">{pendingPayments}</p>
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {pendingPayments > 0 ? 'Needs attention' : 'All up to date'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8% from last month
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</p>
                    <p className="text-2xl font-bold text-foreground">{upcomingDeadlines.length}</p>
                    <p className="text-xs text-yellow-600 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Next 30 days
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming deadlines</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDeadlines.slice(0, 5).map((entity) => {
                      const dueDate = new Date(entity.registered_agent_fee_due_date!);
                      const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={entity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{entity.name}</p>
                            <p className="text-sm text-muted-foreground">Registered Agent Fee</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={daysUntil <= 7 ? "destructive" : "secondary"}>
                              {daysUntil} days
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {dueDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Add New Entity
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Payment
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowScheduleView(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Annual Reports</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Tax Filings</span>
                    <span className="text-sm text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Renewals</span>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entity Portfolio */}
          <div className="space-y-6">
            <EntityPortfolio
              entities={entities}
              onAddEntity={() => setShowAddForm(true)}
              onDeleteEntity={handleDeleteEntity}
            />
          </div>

          {/* Advanced Compliance Tracker */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Compliance Tracker</h2>
              <p className="text-sm text-muted-foreground">
                Advanced compliance monitoring and deadline management
              </p>
            </div>
            <AdvancedComplianceTracker />
          </div>

          {/* Loading State */}
          {entitiesLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

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
      </div>
    </DashboardLayout>
  );
};

export default ModernDashboard;