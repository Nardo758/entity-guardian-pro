import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Search, 
  Filter, 
  AlertTriangle, 
  Eye, 
  Clock,
  RefreshCw,
  Users,
  Lock,
  Settings,
  Activity,
  TrendingUp,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { useAdminAuditLog, type AuditLogEntry } from '@/hooks/useAdminAuditLog';
import { format } from 'date-fns';

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    user_management: <Users className="h-4 w-4" />,
    security: <Shield className="h-4 w-4" />,
    mfa: <Lock className="h-4 w-4" />,
    system: <Settings className="h-4 w-4" />,
    role_management: <UserCheck className="h-4 w-4" />,
  };
  return icons[category] || <Activity className="h-4 w-4" />;
};

const getSeverityColor = (severity: string) => {
  const colors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800 border-blue-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[severity] || colors.info;
};

const AuditLogEntry: React.FC<{ entry: AuditLogEntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            {getCategoryIcon(entry.action_category)}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{entry.action_type.replace(/_/g, ' ')}</span>
              <Badge className={getSeverityColor(entry.severity)}>
                {entry.severity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {entry.action_category.replace(/_/g, ' ')}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">{entry.description}</p>
            
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Admin: {entry.admin_email}</span>
              </div>
              {entry.target_email && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>Target: {entry.target_email}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(entry.created_at), 'PPp')}</span>
              </div>
            </div>

            {expanded && (
              <div className="mt-3 p-3 bg-muted rounded text-xs space-y-2">
                {entry.ip_address && (
                  <div><strong>IP Address:</strong> {entry.ip_address}</div>
                )}
                {entry.user_agent && (
                  <div><strong>User Agent:</strong> <span className="font-mono text-xs">{entry.user_agent}</span></div>
                )}
                {Object.keys(entry.metadata || {}).length > 0 && (
                  <div>
                    <strong>Metadata:</strong>
                    <pre className="mt-1 p-2 bg-background rounded overflow-x-auto">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Less' : 'More'}
        </Button>
      </div>
    </div>
  );
};

export const AdminAuditDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [daysFilter, setDaysFilter] = useState(30);

  const { entries, stats, isLoading, refetch } = useAdminAuditLog({
    category: categoryFilter,
    severity: severityFilter,
    searchTerm,
    days: daysFilter,
    limit: 200,
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
                <h3 className="text-2xl font-bold mt-2">{stats?.total_actions || 0}</h3>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Events</p>
                <h3 className="text-2xl font-bold mt-2 text-destructive">
                  {stats?.recent_critical_events || 0}
                </h3>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MFA Events</p>
                <h3 className="text-2xl font-bold mt-2">
                  {stats?.actions_by_category?.mfa || 0}
                </h3>
              </div>
              <Lock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role Changes</p>
                <h3 className="text-2xl font-bold mt-2">
                  {stats?.actions_by_category?.role_management || 0}
                </h3>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Audit Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Audit Log
              </CardTitle>
              <CardDescription>
                Complete audit trail of all admin actions and security events
              </CardDescription>
            </div>
            <Button onClick={refetch} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search actions, admins, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="user_management">User Management</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="mfa">MFA Events</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="role_management">Role Management</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={daysFilter.toString()} onValueChange={(v) => setDaysFilter(Number(v))}>
              <SelectTrigger className="w-full lg:w-36">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entries List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading audit log...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm || categoryFilter !== 'all' || severityFilter !== 'all'
                    ? 'No matching audit entries found'
                    : 'No audit entries recorded yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Showing {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </p>
                {entries.map((entry) => (
                  <AuditLogEntry key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditDashboard;
