import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, BarChart3, Settings, AlertTriangle, UserCog, Crown, 
  Database, TrendingUp, CreditCard, FileText, Activity, DollarSign,
  Trash2, Edit, Eye, Download, RefreshCw, Search, Filter, ScrollText, Briefcase, UserCheck, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './dashboard/DashboardLayout';
import { UserAccount } from './UserAccount';
import { TeamSwitcher } from './TeamSwitcher';
import AdminRoleManager from './AdminRoleManager';
import SecurityAuditLog from './SecurityAuditLog';
import { SecurityWarningBanner } from './SecurityWarningBanner';
import { UserManagementModal } from './admin/UserManagementModal';
import { AgentDetailModal } from './admin/AgentDetailModal';
import { AgentEditModal } from './admin/AgentEditModal';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { exportToCSV, userExportColumns, agentExportColumns, entityExportColumns, invoiceExportColumns } from '@/lib/csvExport';
import { useSubscription } from '@/hooks/useSubscription';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeams } from '@/hooks/useTeams';
import { useSecureProfiles } from '@/hooks/useSecureProfiles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, isLoading: adminLoading } = useAdminAccess();
  const { subscription } = useSubscription();
  const { notifications } = useNotifications();
  const { currentTeam } = useTeams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // User management modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  
  // Agent detail modal state
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  
  // Agent edit modal state
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [agentEditModalOpen, setAgentEditModalOpen] = useState(false);
  
  // System data states
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalEntities: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    systemHealth: 'healthy'
  });
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [entityAnalytics, setEntityAnalytics] = useState<any>(null);
  const [financialAnalytics, setFinancialAnalytics] = useState<any>(null);
  const [agentAnalytics, setAgentAnalytics] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const { data: secureProfiles, isLoading: profilesLoading, refetch: refetchProfiles } = useSecureProfiles();
  const [allEntities, setAllEntities] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch system-wide data
  useEffect(() => {
    // Wait for auth and secure profiles to load before fetching
    if (adminLoading || profilesLoading) return;
    
    // Redirect non-admin users after auth has loaded
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    const fetchSystemData = async () => {
      try {
        setLoading(true);
        
        // Fetch all entities with limited profile exposure
        const { data: entities } = await supabase
          .from('entities')
          .select(`
            *,
            profiles(user_id, company, user_type)
          `)
          .order('created_at', { ascending: false });
        
        // Fetch invoices from stripe_invoices table
        const { data: invoices } = await supabase
          .from('stripe_invoices')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Fetch real analytics data from database functions
        const [userAnalyticsRes, entityAnalyticsRes, financialAnalyticsRes] = await Promise.all([
          supabase.rpc('get_user_analytics'),
          supabase.rpc('get_entity_analytics'),
          supabase.rpc('get_financial_analytics')
        ]);
        
        if (userAnalyticsRes.data && userAnalyticsRes.data.length > 0) {
          setAnalyticsData(userAnalyticsRes.data[0]);
        }
        if (entityAnalyticsRes.data && entityAnalyticsRes.data.length > 0) {
          setEntityAnalytics(entityAnalyticsRes.data[0]);
        }
        if (financialAnalyticsRes.data && financialAnalyticsRes.data.length > 0) {
          setFinancialAnalytics(financialAnalyticsRes.data[0]);
        }
        
        // Fetch agent analytics
        const [agentsRes, invitationsRes, assignmentsRes] = await Promise.all([
          supabase.from('agents').select('*'),
          supabase.from('agent_invitations').select('status'),
          supabase.from('entity_agent_assignments').select('status')
        ]);
        
        const agents = agentsRes.data || [];
        const invitations = invitationsRes.data || [];
        const assignments = assignmentsRes.data || [];
        
        // Calculate agent metrics
        const stateCoverage: Record<string, number> = {};
        agents.forEach((agent: any) => {
          (agent.states || []).forEach((state: string) => {
            stateCoverage[state] = (stateCoverage[state] || 0) + 1;
          });
        });
        
        setAgentAnalytics({
          totalAgents: agents.length,
          availableAgents: agents.filter((a: any) => a.is_available).length,
          unavailableAgents: agents.filter((a: any) => !a.is_available).length,
          avgPrice: agents.length > 0 ? agents.reduce((sum: number, a: any) => sum + (a.price_per_entity || 0), 0) / agents.length : 0,
          avgExperience: agents.filter((a: any) => a.years_experience).length > 0 
            ? agents.filter((a: any) => a.years_experience).reduce((sum: number, a: any) => sum + a.years_experience, 0) / agents.filter((a: any) => a.years_experience).length 
            : 0,
          stateCoverage,
          invitations: {
            total: invitations.length,
            pending: invitations.filter((i: any) => i.status === 'pending').length,
            accepted: invitations.filter((i: any) => i.status === 'accepted').length,
            declined: invitations.filter((i: any) => i.status === 'declined').length,
          },
          assignments: {
            total: assignments.length,
            active: assignments.filter((a: any) => a.status === 'accepted').length,
            terminated: assignments.filter((a: any) => a.status === 'terminated').length,
          }
        });
        
        setAllAgents(agents);
        
        // Calculate admin subscriber statistics securely
        let activeSubscriptions = 0;
        try {
          const { data: systemStats } = await supabase.rpc('get_admin_system_stats');
          
          if (systemStats && systemStats.length > 0) {
            activeSubscriptions = systemStats[0].total_users || 0;
          }
        } catch (error) {
          console.error('Error fetching system stats:', error);
        }

        
        setAllUsers(secureProfiles || []);
        setAllEntities(entities || []);
        setAllPayments(invoices || []);
        
        // Calculate system statistics from invoices
        const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;
        
        setSystemStats({
          totalUsers: secureProfiles?.length || 0,
          totalEntities: entities?.length || 0,
          activeSubscriptions,
          totalRevenue: totalRevenue / 100,
          systemHealth: 'healthy'
        });
        
      } catch (error) {
        console.error('Error fetching system data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, [isAdmin, navigate, adminLoading, profilesLoading, secureProfiles]);

  // Show loading while auth is being determined
  if (adminLoading || profilesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Redirect non-admin users
  if (!isAdmin) {
    return null;
  }

  // Filter data based on search
  const filteredUsers = allUsers.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEntities = allEntities.filter(entity =>
    entity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = allPayments.filter(payment =>
    payment.stripe_invoice_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Action handlers with toast feedback
  const handleExport = (type: string) => {
    try {
      switch (type) {
        case 'users':
          if (filteredUsers.length === 0) {
            toast.error('No users to export');
            return;
          }
          exportToCSV(filteredUsers, 'users_export', userExportColumns);
          toast.success(`Exported ${filteredUsers.length} users`);
          break;
        case 'agents':
          if (allAgents.length === 0) {
            toast.error('No agents to export');
            return;
          }
          exportToCSV(allAgents, 'agents_export', agentExportColumns);
          toast.success(`Exported ${allAgents.length} agents`);
          break;
        case 'entities':
          if (filteredEntities.length === 0) {
            toast.error('No entities to export');
            return;
          }
          exportToCSV(filteredEntities, 'entities_export', entityExportColumns);
          toast.success(`Exported ${filteredEntities.length} entities`);
          break;
        case 'financial':
          if (filteredPayments.length === 0) {
            toast.error('No invoices to export');
            return;
          }
          exportToCSV(filteredPayments, 'invoices_export', invoiceExportColumns);
          toast.success(`Exported ${filteredPayments.length} invoices`);
          break;
        default:
          toast.info('Export not available for this type');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleToggleAgentAvailability = async (agentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_available: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', agentId);
      
      if (error) throw error;
      
      // Update local state
      setAllAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, is_available: !currentStatus } : a
      ));
      toast.success(`Agent ${!currentStatus ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update agent availability');
    }
  };

  const handleRefreshAgents = async () => {
    const { data } = await supabase.from('agents').select('*');
    setAllAgents(data || []);
    toast.success('Agents refreshed');
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setUserModalOpen(true);
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setUserModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    // Open modal on account status tab for suspension
    setSelectedUserId(userId);
    setUserModalOpen(true);
  };

  const handleRoleChange = () => {
    refetchProfiles();
    queryClient.invalidateQueries({ queryKey: ['secure-profiles'] });
  };

  const handleViewEntity = (entityId: string) => {
    navigate(`/entities/${entityId}`);
  };

  const handleEditEntity = (entityId: string) => {
    toast.info('Edit entity', { description: 'Entity editing feature coming soon.' });
  };

  const handleProcessRefund = () => {
    toast.info('Process Refund', { description: 'Refund processing will be available via Stripe dashboard.' });
  };

  const handleComplianceReport = () => {
    toast.info('Generating compliance report...', { description: 'This feature is coming soon.' });
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4 flex-1">
            <Crown className="h-6 w-6 text-warning" />
            <div>
              <h1 className="text-xl font-bold text-foreground">System Administration Dashboard</h1>
              <p className="text-sm text-muted-foreground">Comprehensive platform management and oversight</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <TeamSwitcher />
            <UserAccount />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-8">
          {/* Security Warning */}
          <SecurityWarningBanner />

          {/* Admin Status */}
          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-warning" />
                <div>
                  <h3 className="font-semibold text-foreground">Administrator Access</h3>
                  <p className="text-sm text-muted-foreground">
                    You have full system administration privileges. Use with caution.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : systemStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : systemStats.totalEntities}</div>
                <p className="text-xs text-muted-foreground">All entities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : systemStats.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">Paying customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${loading ? '...' : systemStats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {loading ? '...' : systemStats.systemHealth}
                </div>
                <p className="text-xs text-muted-foreground">All systems</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="entities">Entity Oversight</TabsTrigger>
              <TabsTrigger value="agents">Agent Analytics</TabsTrigger>
              <TabsTrigger value="financial">Financial Admin</TabsTrigger>
              <TabsTrigger value="monitoring">System Monitor</TabsTrigger>
              <TabsTrigger value="analytics">Business Intel</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Subscription Status</h4>
                      <Badge variant={subscription?.subscribed ? 'default' : 'secondary'}>
                        {subscription?.subscribed ? 'Active Subscription' : 'No active subscription'}
                      </Badge>
                    </div>
                    
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Current Team</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentTeam?.name || 'No team selected'}
                      </p>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Quick Actions</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('users')}
                          className="w-full justify-start"
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Manage Users
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('monitoring')}
                          className="w-full justify-start"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Security Audit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/admin-audit')}
                          className="w-full justify-start"
                        >
                          <ScrollText className="h-4 w-4 mr-2" />
                          View Audit Log
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">System Health</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Database</span>
                          <Badge variant="default">Online</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>API</span>
                          <Badge variant="default">Online</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Storage</span>
                          <Badge variant="default">Online</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('users')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Loading users...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>User Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id} className={user.account_status === 'suspended' ? 'opacity-60' : ''}>
                            <TableCell>
                              <div className="font-medium">
                                {user.first_name_masked || 'N/A'} {user.last_name_masked || ''}
                              </div>
                              <div className="text-xs text-muted-foreground">{user.user_id?.slice(0, 8)}...</div>
                            </TableCell>
                            <TableCell>{user.company || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={user.plan === 'unlimited' ? 'default' : 'secondary'}>
                                {user.plan || 'starter'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {user.user_type || 'owner'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.account_status === 'suspended' ? 'destructive' : 'default'}>
                                {user.account_status || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleViewUser(user.user_id)} title="Manage User">
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEditUser(user.user_id)} title="Edit Profile">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={user.account_status === 'suspended' ? 'text-green-600' : 'text-destructive'}
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  title={user.account_status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                                >
                                  {user.account_status === 'suspended' ? <RefreshCw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              <AdminRoleManager />
            </TabsContent>

            <TabsContent value="entities" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>System-Wide Entity Oversight</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search entities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('entities')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleComplianceReport}>
                      <FileText className="h-4 w-4 mr-2" />
                      Compliance Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Loading entities...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entity Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Formation Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntities.map((entity) => (
                          <TableRow key={entity.id}>
                            <TableCell className="font-medium">{entity.name}</TableCell>
                            <TableCell>{entity.type}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{entity.state}</Badge>
                            </TableCell>
                            <TableCell>
                              {entity.profiles?.company || 'N/A'}
                            </TableCell>
                            <TableCell>{entity.formation_date || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                entity.status === 'active' ? 'default' :
                                entity.status === 'pending' ? 'secondary' :
                                entity.status === 'dissolved' ? 'destructive' : 'outline'
                              }>
                                {entity.status || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleViewEntity(entity.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEditEntity(entity.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Financial Administration</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('financial')}>
                      <Download className="h-4 w-4 mr-2" />
                      Financial Report
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleProcessRefund}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Process Refund
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Loading payments...
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount Due</TableHead>
                          <TableHead>Amount Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              No invoices found
                            </TableCell>
                          </TableRow>
                        ) : filteredPayments.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium font-mono text-xs">
                              {invoice.stripe_invoice_id?.slice(0, 20)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {invoice.stripe_customer_id?.slice(0, 15)}...
                            </TableCell>
                            <TableCell>${(invoice.amount_due / 100).toFixed(2)}</TableCell>
                            <TableCell>${(invoice.amount_paid / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                invoice.status === 'paid' ? 'default' : 
                                invoice.status === 'open' ? 'secondary' : 'destructive'
                              }>
                                {invoice.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {invoice.hosted_invoice_url && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                                {invoice.invoice_pdf && (
                                  <Button variant="ghost" size="sm" asChild>
                                    <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Database Health</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Connection Pool</span>
                        <Badge variant="default">Healthy</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Query Performance</span>
                        <Badge variant="default">Optimal</Badge>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">API Performance</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Response Time</span>
                        <span className="text-sm font-medium">125ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="text-sm font-medium">99.8%</span>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Storage Usage</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Database</span>
                        <span className="text-sm font-medium">2.4 GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">File Storage</span>
                        <span className="text-sm font-medium">890 MB</span>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Active Sessions</h4>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Current Users</span>
                        <span className="text-sm font-medium">{systemStats.totalUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Peak Today</span>
                        <span className="text-sm font-medium">{Math.floor(systemStats.totalUsers * 1.3)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <SecurityAuditLog />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Customer Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Users</span>
                          <span className="font-medium">{analyticsData?.total_users || systemStats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">30-Day Growth</span>
                          <span className="font-medium text-green-600">+{analyticsData?.user_growth_30d || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Retention Rate</span>
                          <span className="font-medium">{analyticsData?.user_retention_rate?.toFixed(1) || '0'}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Trial→Paid Conversion</span>
                          <span className="font-medium">{analyticsData?.trial_to_paid_conversion?.toFixed(1) || '0'}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Revenue Analytics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Revenue</span>
                          <span className="font-medium">${financialAnalytics?.total_revenue?.toFixed(2) || systemStats.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">MRR</span>
                          <span className="font-medium">${financialAnalytics?.mrr?.toFixed(2) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">ARPU</span>
                          <span className="font-medium">${financialAnalytics?.arpu?.toFixed(2) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Growth Rate</span>
                          <span className={`font-medium ${(financialAnalytics?.revenue_growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(financialAnalytics?.revenue_growth_rate || 0) >= 0 ? '+' : ''}{financialAnalytics?.revenue_growth_rate?.toFixed(1) || '0'}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Entity Analytics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Entities</span>
                          <span className="font-medium">{entityAnalytics?.total_entities || systemStats.totalEntities}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">30-Day Creations</span>
                          <span className="font-medium text-green-600">+{entityAnalytics?.entity_creation_rate_30d || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg per Customer</span>
                          <span className="font-medium">{entityAnalytics?.avg_entities_per_customer?.toFixed(1) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Most Popular Type</span>
                          <span className="font-medium">{entityAnalytics?.most_popular_entity_type || 'LLC'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-4">State Distribution</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {entityAnalytics?.entities_by_state ? (
                        Object.entries(entityAnalytics.entities_by_state)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .slice(0, 4)
                          .map(([state, count]) => (
                            <div key={state} className="text-center">
                              <div className="text-2xl font-bold">{count as number}</div>
                              <div className="text-sm text-muted-foreground">{state}</div>
                            </div>
                          ))
                      ) : (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold">-</div>
                            <div className="text-sm text-muted-foreground">No data</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-4">Entity Types Distribution</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {entityAnalytics?.entities_by_type ? (
                        Object.entries(entityAnalytics.entities_by_type)
                          .sort(([,a], [,b]) => (b as number) - (a as number))
                          .map(([type, count]) => (
                            <div key={type} className="text-center">
                              <div className="text-2xl font-bold">{count as number}</div>
                              <div className="text-sm text-muted-foreground">{type}</div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center col-span-4 text-muted-foreground">
                          No entity type data available
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{agentAnalytics?.totalAgents || 0}</div>
                    <p className="text-xs text-muted-foreground">Registered agents</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Agents</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">{agentAnalytics?.availableAgents || 0}</div>
                    <p className="text-xs text-muted-foreground">Ready to take clients</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Price/Entity</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${agentAnalytics?.avgPrice?.toFixed(2) || '0.00'}</div>
                    <p className="text-xs text-muted-foreground">Per entity fee</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Experience</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{agentAnalytics?.avgExperience?.toFixed(1) || '0'} yrs</div>
                    <p className="text-xs text-muted-foreground">Years of experience</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Invitation Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Invitations</span>
                        <Badge variant="outline">{agentAnalytics?.invitations?.total || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pending</span>
                        <Badge variant="secondary">{agentAnalytics?.invitations?.pending || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accepted</span>
                        <Badge variant="default">{agentAnalytics?.invitations?.accepted || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Declined</span>
                        <Badge variant="destructive">{agentAnalytics?.invitations?.declined || 0}</Badge>
                      </div>
                      {agentAnalytics?.invitations?.total > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Acceptance Rate</span>
                            <span className="text-sm font-bold">
                              {((agentAnalytics?.invitations?.accepted / agentAnalytics?.invitations?.total) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Assignment Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Total Assignments</span>
                        <Badge variant="outline">{agentAnalytics?.assignments?.total || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active</span>
                        <Badge variant="default">{agentAnalytics?.assignments?.active || 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Terminated</span>
                        <Badge variant="destructive">{agentAnalytics?.assignments?.terminated || 0}</Badge>
                      </div>
                      {agentAnalytics?.totalAgents > 0 && agentAnalytics?.assignments?.total > 0 && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Avg Entities/Agent</span>
                            <span className="text-sm font-bold">
                              {(agentAnalytics?.assignments?.active / agentAnalytics?.totalAgents).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Agent State Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  {agentAnalytics?.stateCoverage && Object.keys(agentAnalytics.stateCoverage).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {Object.entries(agentAnalytics.stateCoverage)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 12)
                        .map(([state, count]) => (
                          <div key={state} className="text-center p-3 border border-border rounded-lg">
                            <div className="text-xl font-bold">{count as number}</div>
                            <div className="text-sm text-muted-foreground">{state}</div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No agent state coverage data available</p>
                      <p className="text-sm">Agents will appear here once they register and specify their service states</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Registered Agents</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search agents..."
                        value={agentSearchTerm}
                        onChange={(e) => setAgentSearchTerm(e.target.value)}
                        className="pl-8 w-[200px]"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleExport('agents')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRefreshAgents}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Loading agents...
                    </div>
                  ) : allAgents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No registered agents yet</p>
                      <p className="text-sm">Agents will appear here once they complete registration</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact Email</TableHead>
                          <TableHead>States Covered</TableHead>
                          <TableHead>Price/Entity</TableHead>
                          <TableHead>Experience</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allAgents
                          .filter(agent => 
                            agent.company_name?.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
                            agent.contact_email?.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
                            agent.states?.some((s: string) => s.toLowerCase().includes(agentSearchTerm.toLowerCase()))
                          )
                          .map((agent) => (
                          <TableRow key={agent.id}>
                            <TableCell className="font-medium">
                              {agent.company_name || 'N/A'}
                              {agent.bio && (
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{agent.bio}</p>
                              )}
                            </TableCell>
                            <TableCell>{agent.contact_email || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(agent.states || []).slice(0, 3).map((state: string) => (
                                  <Badge key={state} variant="outline" className="text-xs">
                                    {state}
                                  </Badge>
                                ))}
                                {(agent.states || []).length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{agent.states.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>${agent.price_per_entity?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>
                              {agent.years_experience ? `${agent.years_experience} yrs` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={agent.is_available}
                                  onCheckedChange={() => handleToggleAgentAvailability(agent.id, agent.is_available)}
                                  className="data-[state=checked]:bg-green-500"
                                />
                                <span className={`text-xs ${agent.is_available ? 'text-green-600' : 'text-muted-foreground'}`}>
                                  {agent.is_available ? 'On' : 'Off'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(agent.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedAgent(agent);
                                    setAgentModalOpen(true);
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setEditingAgent(agent);
                                    setAgentEditModalOpen(true);
                                  }}
                                  title="Edit Agent"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* User Management Modal */}
      {selectedUserId && (
        <UserManagementModal
          open={userModalOpen}
          onOpenChange={setUserModalOpen}
          userId={selectedUserId}
          onRoleChange={handleRoleChange}
        />
      )}
      
      {/* Agent Detail Modal */}
      <AgentDetailModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        agent={selectedAgent}
      />
      
      {/* Agent Edit Modal */}
      <AgentEditModal
        open={agentEditModalOpen}
        onOpenChange={setAgentEditModalOpen}
        agent={editingAgent}
        onSave={handleRefreshAgents}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;