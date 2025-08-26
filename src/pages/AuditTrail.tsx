import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  Filter, 
  Download, 
  CalendarIcon, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus, 
  Settings, 
  Shield, 
  FileText, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

const AuditTrail = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState<Date>();

  const auditLogs = [
    {
      id: "audit_001",
      timestamp: "2024-12-15T14:30:25Z",
      user: {
        name: "Sarah Johnson",
        email: "sarah@company.com",
        avatar: "/placeholder.svg",
        role: "Admin"
      },
      action: "entity_created",
      resource: "Acme Corp LLC",
      resourceId: "ent_123456",
      details: "Created new LLC entity with Delaware jurisdiction",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      severity: "info",
      changes: [
        { field: "name", oldValue: null, newValue: "Acme Corp LLC" },
        { field: "type", oldValue: null, newValue: "LLC" },
        { field: "jurisdiction", oldValue: null, newValue: "Delaware" }
      ]
    },
    {
      id: "audit_002",
      timestamp: "2024-12-15T13:45:10Z",
      user: {
        name: "Michael Chen",
        email: "michael@company.com",
        avatar: "/placeholder.svg",
        role: "Manager"
      },
      action: "entity_updated",
      resource: "Tech Startup Inc",
      resourceId: "ent_789012",
      details: "Updated renewal date and registered agent information",
      ipAddress: "10.0.0.50",
      userAgent: "Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7)",
      severity: "info",
      changes: [
        { field: "renewal_date", oldValue: "2025-01-15", newValue: "2025-03-15" },
        { field: "registered_agent", oldValue: "Old Agent LLC", newValue: "New Agent Services" }
      ]
    },
    {
      id: "audit_003",
      timestamp: "2024-12-15T12:20:33Z",
      user: {
        name: "System",
        email: "system@entityrenewal.pro",
        avatar: null,
        role: "System"
      },
      action: "renewal_reminder",
      resource: "Global Trading Corp",
      resourceId: "ent_345678",
      details: "Automated renewal reminder sent - 30 days before due date",
      ipAddress: "172.16.0.1",
      userAgent: "EntityRenewal-Bot/1.0",
      severity: "info",
      changes: []
    },
    {
      id: "audit_004",
      timestamp: "2024-12-15T11:15:42Z",
      user: {
        name: "Emma Wilson",
        email: "emma@company.com",
        avatar: "/placeholder.svg",
        role: "User"
      },
      action: "login_failed",
      resource: "User Authentication",
      resourceId: "user_456789",
      details: "Failed login attempt with incorrect password",
      ipAddress: "203.0.113.45",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      severity: "warning",
      changes: []
    },
    {
      id: "audit_005",
      timestamp: "2024-12-15T10:30:15Z",
      user: {
        name: "David Rodriguez",
        email: "david@company.com",
        avatar: "/placeholder.svg",
        role: "Admin"
      },
      action: "user_deleted",
      resource: "John Smith",
      resourceId: "user_987654",
      details: "User account permanently deleted from system",
      ipAddress: "192.168.1.200",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
      severity: "critical",
      changes: [
        { field: "status", oldValue: "inactive", newValue: "deleted" },
        { field: "access_level", oldValue: "user", newValue: null }
      ]
    },
    {
      id: "audit_006",
      timestamp: "2024-12-15T09:45:28Z",
      user: {
        name: "Lisa Park",
        email: "lisa@company.com",
        avatar: "/placeholder.svg",
        role: "Manager"
      },
      action: "document_uploaded",
      resource: "Certificate of Good Standing",
      resourceId: "doc_112233",
      details: "Uploaded compliance document for Manufacturing LLC",
      ipAddress: "10.0.0.75",
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) Chrome/91.0.4472.124",
      severity: "info",
      changes: [
        { field: "document_status", oldValue: null, newValue: "pending_review" },
        { field: "file_size", oldValue: null, newValue: "2.4 MB" }
      ]
    }
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive" className="capitalize">{severity}</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 capitalize">{severity}</Badge>;
      case "info":
        return <Badge variant="outline" className="capitalize">{severity}</Badge>;
      case "success":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 capitalize">{severity}</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{severity}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "entity_created":
      case "entity_updated":
        return <FileText className="h-4 w-4" />;
      case "user_created":
      case "user_updated":
        return <UserPlus className="h-4 w-4" />;
      case "user_deleted":
        return <Trash2 className="h-4 w-4" />;
      case "login_failed":
      case "login_success":
        return <Shield className="h-4 w-4" />;
      case "document_uploaded":
        return <FileText className="h-4 w-4" />;
      case "settings_changed":
        return <Settings className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesUser = userFilter === "all" || log.user.email === userFilter;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueUsers = Array.from(new Set(auditLogs.map(log => log.user.email)))
    .map(email => auditLogs.find(log => log.user.email === email)?.user)
    .filter(Boolean);

  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Audit Trail</h1>
              <p className="text-muted-foreground">Complete log of all system activities and changes</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Action Filter */}
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* User Filter */}
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(user => user && (
                    <SelectItem key={user.email} value={user.email}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange ? format(dateRange, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange}
                    onSelect={setDateRange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Export */}
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{filteredLogs.length}</div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredLogs.filter(log => log.severity === "info" || log.severity === "success").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Normal Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredLogs.filter(log => log.severity === "warning").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredLogs.filter(log => log.severity === "critical").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Critical Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log List */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Chronological record of all system activities and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLogs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-start gap-4 p-4 hover:bg-muted/30 rounded-lg transition-colors">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-lg bg-muted">
                        {getActionIcon(log.action)}
                      </div>
                      {index < filteredLogs.length - 1 && (
                        <div className="w-px h-16 bg-border mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        {/* User Avatar */}
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.user.avatar || undefined} />
                          <AvatarFallback>
                            {log.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>

                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{log.user.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.user.role}
                            </Badge>
                            {getSeverityBadge(log.severity)}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium text-foreground">
                              {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {" • "}
                            <span>{log.resource}</span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {log.details}
                          </p>

                          {/* Changes */}
                          {log.changes.length > 0 && (
                            <div className="space-y-1 mb-3">
                              <h5 className="text-xs font-medium text-muted-foreground uppercase">Changes:</h5>
                              {log.changes.map((change, changeIndex) => (
                                <div key={changeIndex} className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className="text-xs">
                                    {change.field}
                                  </Badge>
                                  {change.oldValue && (
                                    <>
                                      <span className="text-red-600 line-through">
                                        {change.oldValue}
                                      </span>
                                      <span>→</span>
                                    </>
                                  )}
                                  <span className="text-green-600 font-medium">
                                    {change.newValue || "null"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                            </div>
                            <div>IP: {log.ipAddress}</div>
                            <div>ID: {log.resourceId}</div>
                          </div>
                        </div>

                        {/* Severity indicator */}
                        <div className="flex items-center">
                          {getSeverityIcon(log.severity)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < filteredLogs.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 rounded-lg bg-muted/30 inline-block mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or date range
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setActionFilter("all");
                  setUserFilter("all");
                  setDateRange(undefined);
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditTrail;