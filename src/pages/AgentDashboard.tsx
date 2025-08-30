import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, DollarSign, Users, Mail, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { supabase } from '@/integrations/supabase/client';
import { EntityAgentAssignment } from '@/types/agent';

const AgentDashboard = () => {
  const { user } = useAuth();
  const { getUserAgent } = useAgents();
  const { invitations, respondToInvitation, refetch } = useAgentInvitations();
  const [agent, setAgent] = useState(null);
  const [assignments, setAssignments] = useState<EntityAgentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user) return;

      try {
        // Get agent profile
        const agentData = await getUserAgent();
        setAgent(agentData);

        // Get entity assignments
        const { data: assignmentData, error } = await supabase
          .from('entity_agent_assignments')
          .select(`
            *,
            entity:entities(id, name, type, state)
          `)
          .eq('agent_id', agentData?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssignments((assignmentData || []) as EntityAgentAssignment[]);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your registered agent services and client relationships
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Entities</p>
                <p className="text-2xl font-bold">{activeAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Invitations</p>
                <p className="text-2xl font-bold">{pendingInvitations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Annual Earnings</p>
                <p className="text-2xl font-bold">${totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Licensed States</p>
                <p className="text-2xl font-bold">{agent.states.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="entities">My Entities</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations {pendingInvitations.length > 0 && (
              <Badge className="ml-2">{pendingInvitations.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-4">
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
            <div className="grid gap-4">
              {activeAssignments.map(assignment => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{assignment.entity?.name}</span>
                      <Badge variant="secondary">
                        ${agent.price_per_entity}/year
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Entity Type</p>
                        <p className="text-sm text-muted-foreground">{assignment.entity?.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">State</p>
                        <p className="text-sm text-muted-foreground">{assignment.entity?.state}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Assignment Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(assignment.responded_at || assignment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Owner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {pendingInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                <p className="text-muted-foreground">
                  You don't have any pending invitations at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingInvitations.map(invitation => (
                <Card key={invitation.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Registered Agent Request</span>
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
                          <p className="text-sm font-medium">State</p>
                          <p className="text-sm text-muted-foreground">{invitation.entity?.state}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Invited On</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invitation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {invitation.message && (
                        <div>
                          <p className="text-sm font-medium">Message</p>
                          <p className="text-sm text-muted-foreground">{invitation.message}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleInvitationResponse(invitation.token, 'accepted')}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Invitation
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDashboard;