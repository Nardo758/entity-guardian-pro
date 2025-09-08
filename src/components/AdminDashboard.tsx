import React, { useState, useEffect } from 'react';
import { 
  Users, Building, DollarSign, AlertTriangle, TrendingUp, 
  Shield, Database, Settings, Bell, Search, Download,
  Calendar, FileText, CreditCard, Map, BarChart3, 
  Activity, UserCheck, Mail, Phone, Edit, Trash2,
  CheckCircle, XCircle, Clock, Eye, Filter, Plus,
  Crown, UserCog, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useSubscription } from '@/hooks/useSubscription';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeams } from '@/hooks/useTeams';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  const { subscription } = useSubscription();
  const { notifications } = useNotifications();
  const { currentTeam } = useTeams();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // System data states
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalEntities: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    systemHealth: 'healthy'
  });
  const [allUsers, setAllUsers] = useState([]);
  const [allEntities, setAllEntities] = useState([]);
  const [allPayments, setAllPayments] = useState([]);

  // Mock data for enhanced metrics
  const metrics = {
    users: {
      total: systemStats.totalUsers || 2847,
      entityOwners: Math.floor(systemStats.totalUsers * 0.76) || 2156,
      registeredAgents: Math.floor(systemStats.totalUsers * 0.24) || 687,
      admins: 4,
      newThisMonth: 342,
      churnRate: 3.2
    },
    entities: {
      total: systemStats.totalEntities || 8934,
      llc: Math.floor(systemStats.totalEntities * 0.51) || 4521,
      corp: Math.floor(systemStats.totalEntities * 0.35) || 3124,
      partnership: Math.floor(systemStats.totalEntities * 0.10) || 892,
      soleProprietorship: Math.floor(systemStats.totalEntities * 0.04) || 397,
      newThisMonth: 523
    },
    revenue: {
      mrr: systemStats.totalRevenue * 12 || 284750,
      arr: systemStats.totalRevenue || 3417000,
      arpu: 132,
      pendingPayments: 47850,
      processedThisMonth: 892340
    },
    compliance: {
      renewalsCompleted: 94.7,
      documentsProcessed: 1847,
      avgProcessingTime: 2.3,
      overdueRenewals: 23
    }
  };

  const systemAlerts = [
    { id: 1, type: 'security', message: 'Failed login attempts increased by 15%', severity: 'medium', time: '1 hour ago' },
    { id: 2, type: 'performance', message: 'Database query response time above threshold', severity: 'high', time: '2 hours ago' },
    { id: 3, type: 'billing', message: '12 payment failures require attention', severity: 'medium', time: '3 hours ago' },
    { id: 4, type: 'compliance', message: 'Delaware renewal deadline approaching for 45 entities', severity: 'low', time: '5 hours ago' }
  ];

  // Fetch system-wide data
  useEffect(() => {
    const fetchSystemData = async () => {
      if (!isAdmin) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        
        // Fetch all users (profiles)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Fetch all entities
        const { data: entities } = await supabase
          .from('entities')
          .select(`
            *,
            profiles(first_name, last_name, email:user_id)
          `)
          .order('created_at', { ascending: false });
        
        // Fetch all payments
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Fetch subscribers for subscription metrics
        const { data: subscribers } = await supabase
          .from('subscribers')
          .select('*');

        setAllUsers(profiles || []);
        setAllEntities(entities || []);
        setAllPayments(payments || []);
        
        // Calculate system statistics
        const activeSubscriptions = subscribers?.filter(s => s.subscribed).length || 0;
        const totalRevenue = payments?.reduce((sum, p) => p.status === 'paid' ? sum + p.amount : sum, 0) || 0;
        
        setSystemStats({
          totalUsers: profiles?.length || 0,
          totalEntities: entities?.length || 0,
          activeSubscriptions,
          totalRevenue: totalRevenue / 100, // Convert from cents
          systemHealth: 'healthy'
        });
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, [isAdmin, navigate]);

  // Filter functions
  const filteredUsers = allUsers.filter(user =>
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEntities = allEntities.filter(entity =>
    entity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = allPayments.filter(payment =>
    payment.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MetricCard = ({ title, value, change, icon: Icon, color = "blue" }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-${color}-100`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );

  const AlertBadge = ({ type, severity }) => {
    const colors = {
      security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      performance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      billing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      compliance: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    
    return (
      <Badge className={colors[type]}>
        {type}
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">You don't have admin access.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold text-foreground">Entity Renewal Pro - Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </Button>
              </div>
              <Button className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              
              {/* User Menu with Sign Out */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem disabled>
                    <Users className="w-4 h-4 mr-2" />
                    Administrator
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/login');
                    }}
                    className="text-red-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'entities', label: 'Entity Oversight', icon: Building },
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'system', label: 'System Health', icon: Activity },
              { id: 'security', label: 'Security', icon: Shield }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <TabIcon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">System Overview</h2>
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="border border-input rounded-lg px-3 py-2 bg-background text-foreground"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                  title="Total Users" 
                  value={metrics.users.total.toLocaleString()} 
                  change={12.5} 
                  icon={Users} 
                  color="blue" 
                />
                <MetricCard 
                  title="Active Entities" 
                  value={metrics.entities.total.toLocaleString()} 
                  change={8.3} 
                  icon={Building} 
                  color="green" 
                />
                <MetricCard 
                  title="Monthly Revenue" 
                  value={`$${(metrics.revenue.mrr / 1000).toFixed(0)}K`} 
                  change={15.7} 
                  icon={DollarSign} 
                  color="emerald" 
                />
                <MetricCard 
                  title="Compliance Rate" 
                  value={`${metrics.compliance.renewalsCompleted}%`} 
                  change={2.1} 
                  icon={CheckCircle} 
                  color="indigo" 
                />
              </div>
            </div>

            {/* System Alerts */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">System Alerts</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {systemAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.severity === 'high' ? 'text-red-600' : 
                            alert.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">{alert.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <AlertBadge type={alert.type} severity={alert.severity} />
                          <Button variant="ghost" size="sm" className="text-primary">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Entity Owners</span>
                      <span className="text-sm font-medium">{metrics.users.entityOwners.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Registered Agents</span>
                      <span className="text-sm font-medium">{metrics.users.registeredAgents.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Administrators</span>
                      <span className="text-sm font-medium">{metrics.users.admins}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Entity Types */}
              <Card>
                <CardHeader>
                  <CardTitle>Entity Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">LLC</span>
                      <span className="text-sm font-medium">{metrics.entities.llc.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Corporation</span>
                      <span className="text-sm font-medium">{metrics.entities.corp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Partnership</span>
                      <span className="text-sm font-medium">{metrics.entities.partnership.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sole Proprietorship</span>
                      <span className="text-sm font-medium">{metrics.entities.soleProprietorship.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">User Management</h2>
              <Button className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select className="border border-input rounded-lg px-3 py-2 bg-background text-foreground">
                    <option>All Roles</option>
                    <option>Entity Owner</option>
                    <option>Registered Agent</option>
                    <option>Admin</option>
                  </select>
                  <select className="border border-input rounded-lg px-3 py-2 bg-background text-foreground">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Trial</option>
                    <option>Suspended</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.slice(0, 10).map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.user_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {user.user_type || 'owner'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.plan === 'unlimited' ? 'default' : 'outline'}>
                              {user.plan || 'starter'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === 'entities' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Entity Oversight</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">System-wide entity monitoring and compliance tracking.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Total Entities</h4>
                    <p className="text-2xl font-bold">{systemStats.totalEntities}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">This Month</h4>
                    <p className="text-2xl font-bold">+{metrics.entities.newThisMonth}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Compliance Rate</h4>
                    <p className="text-2xl font-bold">{metrics.compliance.renewalsCompleted}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Financial Administration</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Revenue analytics and payment processing oversight.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Total Revenue</h4>
                    <p className="text-2xl font-bold">${systemStats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Monthly Recurring</h4>
                    <p className="text-2xl font-bold">${(metrics.revenue.mrr / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">ARPU</h4>
                    <p className="text-2xl font-bold">${metrics.revenue.arpu}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">System Health</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">System performance and infrastructure monitoring.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">System Status</h4>
                    <Badge variant="default">All Systems Operational</Badge>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Uptime</h4>
                    <p className="text-2xl font-bold">99.9%</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Response Time</h4>
                    <p className="text-2xl font-bold">125ms</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Security Management</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Security monitoring and access control management.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Security Score</h4>
                    <p className="text-2xl font-bold text-green-600">A+</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Active Threats</h4>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-2">Failed Logins</h4>
                    <p className="text-2xl font-bold">23</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;