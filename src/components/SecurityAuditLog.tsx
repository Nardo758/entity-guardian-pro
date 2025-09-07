import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Shield, Search, Filter, AlertTriangle, Eye, Clock } from 'lucide-react';

interface SecurityEvent {
  id: string;
  user_id: string;
  metric_name: string;
  metric_date: string;
  created_at: string;
  metadata: any;
}

const SecurityAuditLog: React.FC = () => {
  const { toast } = useToast();
  const { hasAdminAccess } = useAdminAccess();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  useEffect(() => {
    if (hasAdminAccess) {
      fetchSecurityEvents();
    }
  }, [hasAdminAccess]);

  const fetchSecurityEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*')
        .eq('metric_type', 'security_event')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Security Events",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventName: string) => {
    switch (eventName) {
      case 'Password Reset Request':
        return <Shield className="h-4 w-4" />;
      case 'Role Assignment':
        return <Eye className="h-4 w-4" />;
      case 'Role Removal':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventBadgeVariant = (eventName: string) => {
    switch (eventName) {
      case 'Password Reset Request':
        return 'outline' as const;
      case 'Role Assignment':
        return 'secondary' as const;
      case 'Role Removal':
        return 'destructive' as const;
      default:
        return 'default' as const;
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.metric_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.metadata?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.metadata?.target_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = eventTypeFilter === 'all' || event.metric_name === eventTypeFilter;

    return matchesSearch && matchesFilter;
  });

  if (!hasAdminAccess) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to view security logs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events, emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="Password Reset Request">Password Resets</SelectItem>
                  <SelectItem value="Role Assignment">Role Assignments</SelectItem>
                  <SelectItem value="Role Removal">Role Removals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchSecurityEvents} disabled={loading}>
              Refresh
            </Button>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading security events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || eventTypeFilter !== 'all' ? 'No matching events found' : 'No security events recorded'}
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getEventIcon(event.metric_name)}
                      <span className="font-medium">{event.metric_name}</span>
                      <Badge variant={getEventBadgeVariant(event.metric_name)}>
                        {event.metric_name}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {event.metadata?.email && (
                      <div>Email: <span className="font-mono">{event.metadata.email}</span></div>
                    )}
                    {event.metadata?.target_email && (
                      <div>Target: <span className="font-mono">{event.metadata.target_email}</span></div>
                    )}
                    {event.metadata?.assigned_role && (
                      <div>Role: <Badge variant="outline" className="text-xs">{event.metadata.assigned_role}</Badge></div>
                    )}
                    {event.metadata?.user_agent && (
                      <div className="truncate">User Agent: <span className="font-mono text-xs">{event.metadata.user_agent}</span></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAuditLog;