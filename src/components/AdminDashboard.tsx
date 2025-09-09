import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, BarChart3, Settings, AlertTriangle, UserCog, Crown, 
  Database, TrendingUp, CreditCard, FileText, Activity, DollarSign,
  Trash2, Edit, Eye, Download, RefreshCw, Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './dashboard/DashboardLayout';
import { UserAccount } from './UserAccount';
import { TeamSwitcher } from './TeamSwitcher';
import AdminRoleManager from './AdminRoleManager';
import SecurityAuditLog from './SecurityAuditLog';
import { SecurityWarningBanner } from './SecurityWarningBanner';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useSubscription } from '@/hooks/useSubscription';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeams } from '@/hooks/useTeams';
import { useSecureProfiles } from '@/hooks/useSecureProfiles';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  const { subscription } = useSubscription();
  const { notifications } = useNotifications();
  const { currentTeam } = useTeams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // System data states
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalEntities: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    systemHealth: 'healthy'
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const { data: secureProfiles, isLoading: profilesLoading } = useSecureProfiles();
  const [allEntities, setAllEntities] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch system-wide data
  useEffect(() => {
    const fetchSystemData = async () => {
      if (!isAdmin) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        
        // Use secure profiles from the hook - wait for them to load
        if (!secureProfiles) return;
        
        // Fetch all entities with limited profile exposure
        const { data: entities } = await supabase
          .from('entities')
          .select(`
            *,
            profiles(user_id, company, user_type)
          `)
          .order('created_at', { ascending: false });
        
        // Fetch all payments
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Fetch subscribers using secure admin function
        const { data: subscribersData, error: subscribersError } = await supabase
          .rpc('get_admin_subscriber_stats');
        
        if (subscribersError) {
          console.error('Error fetching subscriber stats:', subscribersError);
          toast.error('Failed to load subscriber statistics');
        }

        setAllUsers(secureProfiles || []);
        setAllEntities(entities || []);
        setAllPayments(payments || []);
        
        // Calculate system statistics
        const activeSubscriptions = subscribers?.filter(s => s.subscribed).length || 0;
        const totalRevenue = payments?.reduce((sum, p) => p.status === 'paid' ? sum + p.amount : sum, 0) || 0;
        
        setSystemStats({
          totalUsers: secureProfiles?.length || 0,
          totalEntities: entities?.length || 0,
          activeSubscriptions,
          totalRevenue: totalRevenue / 100, // Convert from cents
          systemHealth: 'healthy'
        });
        
      } catch (error) {
        console.error('Error fetching system data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemData();
  }, [isAdmin, navigate]);

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
    payment.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="entities">Entity Oversight</TabsTrigger>
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
                          onClick={() => setActiveTab('security')}
                          className="w-full justify-start"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Security Audit
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
                    <Button variant="outline" size="sm">
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
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>User Type</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="font-medium">
                                {user.first_name_masked || 'N/A'} {user.last_name_masked || ''}
                              </div>
                            </TableCell>
                            <TableCell>{user.user_id}</TableCell>
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
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
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
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
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
                            <TableCell>{entity.formation_date}</TableCell>
                            <TableCell>
                              <Badge variant="default">Active</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
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
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Financial Report
                    </Button>
                    <Button variant="outline" size="sm">
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
                          <TableHead>Entity</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.entity_name}</TableCell>
                            <TableCell>{payment.type}</TableCell>
                            <TableCell>${(payment.amount / 100).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                payment.status === 'paid' ? 'default' : 
                                payment.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                            <TableCell>
                              {new Date(payment.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <RefreshCw className="h-4 w-4" />
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
                          <span className="text-sm">Monthly Signups</span>
                          <span className="font-medium">+{Math.floor(systemStats.totalUsers * 0.1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Retention Rate</span>
                          <span className="font-medium">94%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Churn Rate</span>
                          <span className="font-medium">6%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Revenue Analytics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Monthly Revenue</span>
                          <span className="font-medium">${(systemStats.totalRevenue * 0.1).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Avg. Revenue per User</span>
                          <span className="font-medium">${systemStats.totalUsers > 0 ? (systemStats.totalRevenue / systemStats.totalUsers).toFixed(2) : '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Growth Rate</span>
                          <span className="font-medium text-success">+12%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Popular Entity Types</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">LLC</span>
                          <span className="font-medium">65%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Corporation</span>
                          <span className="font-medium">25%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Partnership</span>
                          <span className="font-medium">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 border border-border rounded-lg">
                    <h4 className="font-medium mb-4">State Distribution</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">35%</div>
                        <div className="text-sm text-muted-foreground">Delaware</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">18%</div>
                        <div className="text-sm text-muted-foreground">Nevada</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">15%</div>
                        <div className="text-sm text-muted-foreground">Wyoming</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">32%</div>
                        <div className="text-sm text-muted-foreground">Other</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;