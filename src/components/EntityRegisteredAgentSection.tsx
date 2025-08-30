import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, ExternalLink, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Agent {
  id: string;
  company_name?: string;
  contact_email?: string;
  states: string[];
  price_per_entity: number;
}

interface Assignment {
  id: string;
  status: string;
  agent?: Agent;
}

interface Invitation {
  id: string;
  status: string;
  expires_at: string;
  agent_email: string;
}

interface EntityRegisteredAgentSectionProps {
  entityId: string;
  entityState: string;
}

export const EntityRegisteredAgentSection: React.FC<EntityRegisteredAgentSectionProps> = ({
  entityId,
  entityState
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentStatus = async () => {
      if (!user || !entityId) return;

      try {
        // Check for active assignment
        const { data: assignmentData } = await supabase
          .from('entity_agent_assignments')
          .select(`
            id,
            status,
            agent:agents(id, company_name, contact_email, states, price_per_entity)
          `)
          .eq('entity_id', entityId)
          .eq('status', 'accepted')
          .single();

        if (assignmentData) {
          setAssignment(assignmentData as Assignment);
        } else {
          // Check for pending invitation
          const { data: invitationData } = await supabase
            .from('agent_invitations')
            .select('id, status, expires_at, agent_email')
            .eq('entity_id', entityId)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .single();

          if (invitationData) {
            setInvitation(invitationData as Invitation);
          }
        }
      } catch (error) {
        console.error('Error fetching agent status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStatus();
  }, [entityId, user]);

  const handleRemoveAgent = async () => {
    if (!assignment) return;

    try {
      await supabase
        .from('entity_agent_assignments')
        .update({ status: 'terminated' })
        .eq('id', assignment.id);

      setAssignment(null);
    } catch (error) {
      console.error('Error removing agent:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Registered Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignment?.agent ? (
          // Agent assigned
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">
                  {assignment.agent.company_name || 'Professional Agent'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  ${assignment.agent.price_per_entity}/year
                </p>
                {assignment.agent.contact_email && (
                  <p className="text-sm text-muted-foreground">
                    {assignment.agent.contact_email}
                  </p>
                )}
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            
            <div className="flex gap-2">
              {assignment.agent.contact_email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`mailto:${assignment.agent?.contact_email}`, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveAgent}
              >
                Remove Agent
              </Button>
            </div>
          </div>
        ) : invitation ? (
          // Invitation pending
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">Invitation Pending</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Invitation sent to: {invitation.agent_email}
              </p>
              <p className="text-sm text-muted-foreground">
                Expires: {new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          // No agent assigned
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">No registered agent assigned</span>
            </div>
            <Button 
              onClick={() => navigate('/find-agents')}
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              Find Agent
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};