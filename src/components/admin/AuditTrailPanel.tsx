import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, AlertTriangle, Eye, Download, Search, Filter,
  Calendar, User, Database, FileText, Key, Activity,
  CheckCircle, XCircle, Clock, Globe, Laptop
} from 'lucide-react';
import { useAuditTrail } from '@/hooks/useAuditTrail';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AuditTrailPanel = () => {
  const { 
    auditEvents, 
    complianceReports, 
    loading, 
    error,
    generateComplianceReport,
    searchAuditEvents 
  } = useAuditTrail();

  const [searchFilters, setSearchFilters] = useState({
    event_type: '',
    resource_type: '',
    user_id: '',
    severity: '',
    date_from: '',
    date_to: '',
  });
  const [filteredEvents, setFilteredEvents] = useState(auditEvents);
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);

  React.useEffect(() => {
    const filtered = searchAuditEvents(searchFilters);
    setFilteredEvents(filtered);
  }, [auditEvents, searchFilters, searchAuditEvents]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load audit trail data</p>
        </CardContent>
      </Card>
    );
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'create': return <FileText className="w-4 h-4 text-green-600" />;
      case 'update': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'delete': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'access': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'auth': return <Shield className="w-4 h-4 text-orange-600" />;
      case 'system': return <Database className="w-4 h-4 text-indigo-600" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'user': return <User className="w-4 h-4" />;
      case 'entity': return <FileText className="w-4 h-4" />;
      case 'payment': return <Database className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'api_key': return <Key className="w-4 h-4" />;
      case 'system': return <Database className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFindingSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  const handleGenerateReport = async (reportType: 'data_access' | 'user_activity' | 'system_changes' | 'security_events') => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      
      await generateComplianceReport(reportType, startDate.toISOString(), endDate.toISOString());
      toast.success('Compliance report generated successfully');
      setIsGenerateReportOpen(false);
    } catch (err) {
      toast.error('Failed to generate compliance report');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      event_type: '',
      resource_type: '',
      user_id: '',
      severity: '',
      date_from: '',
      date_to: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Audit Trail & Compliance</h2>
        <div className="flex gap-2">
          <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Compliance Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Select the type of compliance report to generate for the last 30 days.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => handleGenerateReport('security_events')}
                  >
                    <Shield className="w-6 h-6 mb-2 text-red-600" />
                    <span className="font-medium">Security Events</span>
                    <span className="text-xs text-muted-foreground">Login attempts, access violations</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => handleGenerateReport('data_access')}
                  >
                    <Eye className="w-6 h-6 mb-2 text-blue-600" />
                    <span className="font-medium">Data Access</span>
                    <span className="text-xs text-muted-foreground">Document and record access</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => handleGenerateReport('user_activity')}
                  >
                    <User className="w-6 h-6 mb-2 text-green-600" />
                    <span className="font-medium">User Activity</span>
                    <span className="text-xs text-muted-foreground">User actions and behaviors</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => handleGenerateReport('system_changes')}
                  >
                    <Database className="w-6 h-6 mb-2 text-purple-600" />
                    <span className="font-medium">System Changes</span>
                    <span className="text-xs text-muted-foreground">Configuration and data changes</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Audit Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{auditEvents.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {auditEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length}
                </p>
                <p className="text-sm text-muted-foreground">High Risk Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{complianceReports.length}</p>
                <p className="text-sm text-muted-foreground">Compliance Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(auditEvents.map(e => e.user_id)).size}
                </p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Audit Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={searchFilters.event_type} onValueChange={(value) => handleFilterChange('event_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select value={searchFilters.resource_type} onValueChange={(value) => handleFilterChange('resource_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All resources</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="entity">Entity</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={searchFilters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={searchFilters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={searchFilters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEvents.slice(0, 20).map((event) => (
              <div key={event.id} className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getEventTypeIcon(event.event_type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{event.action}</h4>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                        {event.user_email && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.user_email}
                          </span>
                        )}
                        {event.ip_address && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {event.ip_address}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {getResourceTypeIcon(event.resource_type)}
                          {event.resource_type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {event.changes && (
                  <div className="mt-3 pt-3 border-t">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Changes:</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {event.changes.before && (
                        <div>
                          <span className="font-medium text-red-600">Before:</span>
                          <pre className="text-muted-foreground mt-1">{JSON.stringify(event.changes.before, null, 2)}</pre>
                        </div>
                      )}
                      {event.changes.after && (
                        <div>
                          <span className="font-medium text-green-600">After:</span>
                          <pre className="text-muted-foreground mt-1">{JSON.stringify(event.changes.after, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4" />
                <p>No audit events match the current filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceReports.map((report) => (
              <div key={report.id} className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground capitalize">
                      {report.report_type.replace('_', ' ')} Report
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Score: {report.compliance_score}%</Badge>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Events:</span>
                    <span className="ml-2 font-medium">{report.total_events.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Critical Events:</span>
                    <span className="ml-2 font-medium text-red-600">{report.critical_events}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Generated:</span>
                    <span className="ml-2 font-medium">{new Date(report.generated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {report.findings.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Key Findings:</h5>
                    {report.findings.slice(0, 3).map((finding) => (
                      <div key={finding.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${getFindingSeverityColor(finding.severity)}`} />
                          {finding.title}
                        </span>
                        <Badge variant="outline" className={getSeverityColor(finding.severity)}>
                          {finding.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {complianceReports.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>No compliance reports generated yet. Generate your first report above.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrailPanel;