import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Calendar as CalendarIcon,
  TrendingUp,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useEntities } from '@/hooks/useEntities';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ComplianceDeadline {
  id: string;
  entity_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  deadline_type: string;
  filing_fee?: number;
  state: string;
  entity_name?: string;
}

interface ComplianceMetrics {
  totalDeadlines: number;
  completedDeadlines: number;
  overdueDeadlines: number;
  upcomingDeadlines: number;
  complianceRate: number;
}

export const AdvancedComplianceTracker: React.FC = () => {
  const { user } = useAuth();
  const { entities } = useEntities();
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalDeadlines: 0,
    completedDeadlines: 0,
    overdueDeadlines: 0,
    upcomingDeadlines: 0,
    complianceRate: 0,
  });

  useEffect(() => {
    if (user?.id) {
      fetchComplianceDeadlines();
    }
  }, [user?.id, entities]);

  const fetchComplianceDeadlines = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('compliance_deadlines')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Get entity names separately
      const entityIds = [...new Set(data?.map(d => d.entity_id).filter(Boolean))];
      const entitiesMap = new Map();
      
      if (entityIds.length > 0) {
        const { data: entitiesData } = await supabase
          .from('entities')
          .select('id, name')
          .in('id', entityIds);
        
        entitiesData?.forEach(entity => {
          entitiesMap.set(entity.id, entity.name);
        });
      }

      const formattedDeadlines: ComplianceDeadline[] = data?.map(deadline => ({
        id: deadline.id,
        entity_id: deadline.entity_id,
        title: deadline.title,
        description: deadline.description,
        due_date: deadline.due_date,
        status: deadline.status as 'pending' | 'completed' | 'overdue',
        deadline_type: deadline.deadline_type,
        filing_fee: deadline.filing_fee,
        state: deadline.state,
        entity_name: entitiesMap.get(deadline.entity_id),
      })) || [];

      setDeadlines(formattedDeadlines);
      calculateMetrics(formattedDeadlines);
    } catch (error) {
      console.error('Error fetching compliance deadlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (deadlineData: ComplianceDeadline[]) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const completed = deadlineData.filter(d => d.status === 'completed').length;
    const overdue = deadlineData.filter(d => {
      const dueDate = new Date(d.due_date);
      return d.status === 'pending' && dueDate < now;
    }).length;
    const upcoming = deadlineData.filter(d => {
      const dueDate = new Date(d.due_date);
      return d.status === 'pending' && dueDate >= now && dueDate <= thirtyDaysFromNow;
    }).length;

    const total = deadlineData.length;
    const complianceRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setMetrics({
      totalDeadlines: total,
      completedDeadlines: completed,
      overdueDeadlines: overdue,
      upcomingDeadlines: upcoming,
      complianceRate,
    });
  };

  const getStatusBadge = (deadline: ComplianceDeadline) => {
    const now = new Date();
    const dueDate = new Date(deadline.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (deadline.status === 'completed') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-200">Completed</Badge>;
    }

    if (daysUntilDue < 0) {
      return <Badge className="bg-red-500/10 text-red-600 border-red-200">Overdue</Badge>;
    }

    if (daysUntilDue <= 7) {
      return <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">Due Soon</Badge>;
    }

    if (daysUntilDue <= 30) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Upcoming</Badge>;
    }

    return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Scheduled</Badge>;
  };

  const getStatusIcon = (deadline: ComplianceDeadline) => {
    const now = new Date();
    const dueDate = new Date(deadline.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (deadline.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }

    if (daysUntilDue < 0) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }

    if (daysUntilDue <= 7) {
      return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    }

    return <Clock className="w-5 h-5 text-blue-600" />;
  };

  const markAsCompleted = async (deadlineId: string) => {
    const { error } = await supabase
      .from('compliance_deadlines')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', deadlineId);

    if (error) {
      console.error('Error updating deadline status:', error);
      return;
    }

    // Refresh the data
    fetchComplianceDeadlines();
  };

  const getDeadlinesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return deadlines.filter(deadline => 
      deadline.due_date.startsWith(dateStr)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Compliance Tracker</h2>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-foreground">{metrics.complianceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <Progress value={metrics.complianceRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-foreground">{metrics.overdueDeadlines}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                metrics.overdueDeadlines > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}>
                <AlertCircle className={`w-6 h-6 ${
                  metrics.overdueDeadlines > 0 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold text-foreground">{metrics.upcomingDeadlines}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{metrics.completedDeadlines}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Deadline List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {deadlines.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No compliance deadlines found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deadlines.map((deadline) => (
                <Card key={deadline.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {getStatusIcon(deadline)}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{deadline.title}</h3>
                              <p className="text-sm text-muted-foreground">{deadline.entity_name}</p>
                            </div>
                            {getStatusBadge(deadline)}
                          </div>
                          
                          {deadline.description && (
                            <p className="text-sm text-muted-foreground mb-3">{deadline.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              Due: {new Date(deadline.due_date).toLocaleDateString()}
                            </span>
                            <span>State: {deadline.state}</span>
                            {deadline.filing_fee && (
                              <span>Fee: ${deadline.filing_fee}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {deadline.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => markAsCompleted(deadline.id)}
                          className="ml-4"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  Deadlines for {selectedDate?.toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-3">
                    {getDeadlinesForDate(selectedDate).map((deadline) => (
                      <div key={deadline.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(deadline)}
                          <div>
                            <p className="font-medium text-foreground">{deadline.title}</p>
                            <p className="text-sm text-muted-foreground">{deadline.entity_name}</p>
                          </div>
                        </div>
                        {getStatusBadge(deadline)}
                      </div>
                    ))}
                    {getDeadlinesForDate(selectedDate).length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        No deadlines for this date
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a date to view deadlines
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">+15%</span>
                    </div>
                  </div>
                  <Progress value={85} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Month</span>
                    <span className="text-sm font-medium">74%</span>
                  </div>
                  <Progress value={74} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deadline Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Annual Reports</span>
                    <Badge variant="secondary">
                      {deadlines.filter(d => d.deadline_type === 'annual_report').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tax Filings</span>
                    <Badge variant="secondary">
                      {deadlines.filter(d => d.deadline_type === 'tax_filing').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Renewals</span>
                    <Badge variant="secondary">
                      {deadlines.filter(d => d.deadline_type === 'renewal').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};