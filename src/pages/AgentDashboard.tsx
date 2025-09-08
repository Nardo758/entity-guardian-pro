import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Building, DollarSign, Users, Mail, MapPin, CheckCircle, XCircle, FileText, 
  Calendar as CalendarIcon, Send, Download, Upload, Bell, Search, Filter,
  AlertCircle, Clock, TrendingUp, Eye, Edit, Plus, MessageCircle, Receipt,
  Folder, Archive, Settings, BarChart3, Target, FileCheck, Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { supabase } from '@/integrations/supabase/client';
import { EntityAgentAssignment } from '@/types/agent';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

const AgentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getUserAgent } = useAgents();
  const { invitations, respondToInvitation, refetch } = useAgentInvitations();
  const [agent, setAgent] = useState(null);
  const [assignments, setAssignments] = useState<EntityAgentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [correspondence, setCorrespondence] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user) return;

      try {
        // Get agent profile
        const agentData = await getUserAgent();
        setAgent(agentData);

        if (!agentData?.id) return;

        // Get entity assignments
        const { data: assignmentData, error } = await supabase
          .from('entity_agent_assignments')
          .select(`
            *,
            entity:entities(id, name, type, state)
          `)
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssignments((assignmentData || []) as EntityAgentAssignment[]);

        // Get agent documents
        const { data: docsData } = await supabase
          .from('agent_documents')
          .select('*')
          .eq('agent_id', agentData.id)
          .order('received_date', { ascending: false });
        setDocuments(docsData || []);

        // Get compliance deadlines for assigned entities
        const entityIds = (assignmentData || []).map(a => a.entity_id);
        if (entityIds.length > 0) {
          const { data: deadlinesData } = await supabase
            .from('compliance_deadlines')
            .select('*, entity:entities(name)')
            .in('entity_id', entityIds)
            .order('due_date', { ascending: true });
          setDeadlines(deadlinesData || []);
        }

        // Get invoices for this agent
        const { data: invoicesData } = await supabase
          .from('agent_invoices')
          .select('*, entity:entities(name)')
          .eq('agent_id', agentData.id)
          .order('created_at', { ascending: false });
        setInvoices(invoicesData || []);

      } catch (error) {
        console.error('Error fetching agent data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [user]);

  const handleInvitationResponse = async (token: string, response: 'accepted' | 'declined') => {
    await respondToInvitation(token, response);
    refetch();
    // Refresh assignments if accepted
    if (response === 'accepted') {
      window.location.reload();
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const activeAssignments = assignments.filter(a => a.status === 'accepted');
  const totalEarnings = activeAssignments.reduce((sum, a) => {
    return sum + (agent?.price_per_entity || 199);
  }, 0);

  // Calculate dashboard metrics
  const pendingDocuments = documents.filter(doc => doc.status === 'received').length;
  const upcomingDeadlines = deadlines.filter(d => {
    const dueDate = new Date(d.due_date);
    const today = new Date();
    const diffDays = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 30 && diffDays >= 0;
  }).length;
  const outstandingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto px-6 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Agent Profile Not Found</h1>
        <p className="text-muted-foreground mb-4">
          You need to create an agent profile to access this dashboard.
        </p>
        <Button onClick={() => window.location.href = '/agent-signup'}>
          Create Agent Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Registered Agent Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive management platform for your registered agent services
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50">
              Licensed in {agent.states.length} states
            </Badge>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </Button>
            
            {/* User Menu with Sign Out */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Agent</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled>
                  <Building className="w-4 h-4 mr-2" />
                  Registered Agent
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/agent-signup')}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
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

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Entities</p>
                <p className="text-2xl font-bold">{activeAssignments.length}</p>
                <p className="text-xs text-green-600">+2 this month</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Documents</p>
                <p className="text-2xl font-bold">{pendingDocuments}</p>
                <p className="text-xs text-orange-600">Requires action</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</p>
                <p className="text-2xl font-bold">{upcomingDeadlines}</p>
                <p className="text-xs text-red-600">Next 30 days</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${(totalRevenue / 100).toLocaleString()}</p>
                <p className="text-xs text-green-600">+15% vs last month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entities">
            Entities ({activeAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents {pendingDocuments > 0 && <Badge className="ml-1">{pendingDocuments}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="compliance">
            Compliance {upcomingDeadlines > 0 && <Badge className="ml-1">{upcomingDeadlines}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="billing">
            Billing {outstandingInvoices > 0 && <Badge className="ml-1">{outstandingInvoices}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations {pendingInvitations.length > 0 && <Badge className="ml-1">{pendingInvitations.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Dashboard Summary */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-sm">New document received for TechCorp LLC</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <Receipt className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Invoice #2024-003 paid</span>
                    </div>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-orange-500 mr-2" />
                      <span className="text-sm">Annual report deadline approaching</span>
                    </div>
                    <span className="text-xs text-muted-foreground">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="h-20 flex-col space-y-2">
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Upload Document</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Receipt className="w-6 h-6" />
                    <span className="text-sm">Create Invoice</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-sm">Send Message</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-sm">View Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Revenue chart visualization would go here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Client growth chart would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Entity Portfolio Management */}
        <TabsContent value="entities" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Client Entity Portfolio</h3>
            <div className="flex items-center space-x-2">
              <Input 
                placeholder="Search entities..." 
                className="w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {activeAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Entities</h3>
                <p className="text-muted-foreground">
                  You don't have any active entity assignments yet. Check your invitations tab for pending requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Service Start</TableHead>
                      <TableHead>Annual Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAssignments.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.entity?.name}</TableCell>
                        <TableCell>{assignment.entity?.type}</TableCell>
                        <TableCell>{assignment.entity?.state}</TableCell>
                        <TableCell>
                          {new Date(assignment.responded_at || assignment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${agent.price_per_entity}/year</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Document Management */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Document Management</h3>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Received Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingDocuments}</div>
                <p className="text-sm text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Forwarded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Archived Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-sm text-muted-foreground">Total archived</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Annual Report - State Filing</TableCell>
                    <TableCell>TechCorp LLC</TableCell>
                    <TableCell>Government Correspondence</TableCell>
                    <TableCell>2 hours ago</TableCell>
                    <TableCell><Badge variant="destructive">Pending</Badge></TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">Forward</Button>
                        <Button size="sm" variant="ghost"><Download className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Management */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Dashboard</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Deadline
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                  Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">3</div>
                <p className="text-sm text-muted-foreground">Due in 7 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{upcomingDeadlines}</div>
                <p className="text-sm text-muted-foreground">Next 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">47</div>
                <p className="text-sm text-muted-foreground">This year</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Compliance Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-sm text-muted-foreground">Above average</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deadlines.slice(0, 5).map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div>
                        <p className="font-medium">{deadline.title}</p>
                        <p className="text-sm text-muted-foreground">{deadline.entity?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(deadline.due_date).toLocaleDateString()}</p>
                      <Badge variant="outline">{deadline.state}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing & Invoicing */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Billing & Revenue Management</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(outstandingInvoices * 199).toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">{outstandingInvoices} invoices</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalRevenue / 100).toLocaleString()}</div>
                <p className="text-sm text-green-600">+15% vs last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18 days</div>
                <p className="text-sm text-muted-foreground">Payment cycle</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Annual Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalEarnings.toLocaleString()}</div>
                <p className="text-sm text-green-600">Projected</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 5).map((invoice, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.entity?.name}</TableCell>
                      <TableCell>${(invoice.amount / 100).toFixed(2)}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="ghost"><Send className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Client Communications</h3>
            <Button>
              <MessageCircle className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 border rounded-lg">
                    <Mail className="w-5 h-5 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">TechCorp LLC - Annual Report</p>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Forwarded annual report filing confirmation to client
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 border rounded-lg">
                    <MessageCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">StartupCo Inc - Service Agreement</p>
                        <span className="text-sm text-muted-foreground">1 day ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Client inquiry about additional compliance services
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span>2.3 hours</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Client Satisfaction</span>
                      <span>4.8/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '96%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Multi-State Compliance Calendar */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Multi-State Compliance Calendar</h3>
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {agent.states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button>
                <Globe className="w-4 h-4 mr-2" />
                Filing Portals
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines by State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agent.states.map(state => (
                    <div key={state} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{state}</p>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 5) + 1} entities
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.floor(Math.random() * 10) + 1} deadlines
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Filing Portals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agent.states.slice(0, 5).map(state => (
                    <div key={state} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{state} Secretary of State</p>
                        <p className="text-sm text-muted-foreground">Online filing portal</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Globe className="w-4 h-4 mr-2" />
                        Access Portal
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Client Onboarding & Invitations */}
        <TabsContent value="invitations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Client Onboarding & Invitations</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Service Agreement
            </Button>
          </div>

          {pendingInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                <p className="text-muted-foreground">
                  You don't have any pending client invitations at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingInvitations.map(invitation => (
                <Card key={invitation.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>New Client Onboarding Request</span>
                      <Badge>Pending Response</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Entity Name</p>
                          <p className="text-sm text-muted-foreground">{invitation.entity?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Entity Type</p>
                          <p className="text-sm text-muted-foreground">{invitation.entity?.type}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">State of Formation</p>
                          <p className="text-sm text-muted-foreground">{invitation.entity?.state}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Service Request Date</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {invitation.message && (
                        <div>
                          <p className="text-sm font-medium">Client Message</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {invitation.message}
                          </p>
                        </div>
                      )}

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Service Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Annual Fee:</span>
                            <span className="ml-2 font-medium">${agent.price_per_entity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Service Type:</span>
                            <span className="ml-2 font-medium">Registered Agent</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleInvitationResponse(invitation.token, 'accepted')}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept & Begin Service
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleInvitationResponse(invitation.token, 'declined')}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Onboarding Checklist for Accepted Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Onboardings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAssignments.slice(0, 3).map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.entity?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {new Date(assignment.responded_at || assignment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Service Active</Badge>
                      <Button size="sm" variant="ghost">
                        <FileCheck className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDashboard;