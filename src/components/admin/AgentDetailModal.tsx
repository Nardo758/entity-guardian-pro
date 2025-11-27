import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Briefcase, Mail, DollarSign, Clock, MapPin, 
  CheckCircle, XCircle, Building, Calendar, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AgentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: {
    id: string;
    user_id: string;
    company_name?: string;
    contact_email?: string;
    bio?: string;
    states: string[];
    price_per_entity: number;
    years_experience?: number;
    is_available: boolean;
    created_at: string;
    updated_at: string;
  } | null;
}

interface Assignment {
  id: string;
  entity_id: string;
  status: string;
  assigned_at: string;
  terminated_at?: string;
  agreed_fee: number;
  entity?: {
    name: string;
    type: string;
    state: string;
  };
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  open,
  onOpenChange,
  agent,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && agent?.id) {
      fetchAssignments();
    }
  }, [open, agent?.id]);

  const fetchAssignments = async () => {
    if (!agent?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('entity_agent_assignments')
        .select(`
          id,
          entity_id,
          status,
          assigned_at,
          terminated_at,
          agreed_fee,
          entities (
            name,
            type,
            state
          )
        `)
        .eq('agent_id', agent.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        entity: item.entities
      }));
      
      setAssignments(transformedData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return null;

  const activeAssignments = assignments.filter(a => a.status === 'accepted');
  const terminatedAssignments = assignments.filter(a => a.status === 'terminated');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Agent Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{agent.company_name || 'Unknown Company'}</span>
                  <Badge variant={agent.is_available ? 'default' : 'secondary'}>
                    {agent.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.contact_email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${agent.price_per_entity?.toFixed(2) || '0.00'} per entity</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{agent.years_experience ? `${agent.years_experience} years experience` : 'Experience not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(agent.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {agent.bio && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Bio</h4>
                      <p className="text-sm text-muted-foreground">{agent.bio}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* States Covered */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  States Covered ({agent.states?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent.states && agent.states.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {agent.states.map((state) => (
                      <Badge key={state} variant="outline">
                        {state}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No states specified</p>
                )}
              </CardContent>
            </Card>

            {/* Assignment History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Assignment History ({assignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading assignments...
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No assignment history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Assignments */}
                    {activeAssignments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Active Assignments ({activeAssignments.length})
                        </h4>
                        <div className="space-y-2">
                          {activeAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="p-3 border border-border rounded-lg bg-green-500/5"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{assignment.entity?.name || 'Unknown Entity'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {assignment.entity?.type} • {assignment.entity?.state}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="default">Active</Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ${assignment.agreed_fee?.toFixed(2) || '0.00'}/entity
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Terminated Assignments */}
                    {terminatedAssignments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          Terminated Assignments ({terminatedAssignments.length})
                        </h4>
                        <div className="space-y-2">
                          {terminatedAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="p-3 border border-border rounded-lg opacity-75"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{assignment.entity?.name || 'Unknown Entity'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {assignment.entity?.type} • {assignment.entity?.state}
                                  </p>
                                </div>
                                <Badge variant="destructive">Terminated</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(assignment.assigned_at).toLocaleDateString()} - {assignment.terminated_at ? new Date(assignment.terminated_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{activeAssignments.length}</div>
                  <p className="text-xs text-muted-foreground">Active Clients</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{terminatedAssignments.length}</div>
                  <p className="text-xs text-muted-foreground">Past Clients</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">
                    ${activeAssignments.reduce((sum, a) => sum + (a.agreed_fee || 0), 0).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Active Revenue</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetailModal;
