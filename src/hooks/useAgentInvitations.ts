import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentInvitation } from '@/types/agent';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useAgentInvitations = () => {
  const [invitations, setInvitations] = useState<AgentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSent: 0,
    pendingCount: 0,
    acceptedCount: 0,
    declinedCount: 0,
    unsentCount: 0,
    entitiesWithAgents: 0
  });
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch invitations
      const { data, error } = await supabase
        .from('agent_invitations')
        .select(`
          *,
          entity:entities(id, name, type, state),
          agent:agents(id, company_name, contact_email)
        `)
        .eq('entity_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data || []) as any[]);

      // Fetch metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_agent_invitation_metrics', { owner_id: user.id });

      if (metricsError) throw metricsError;
      
      if (metricsData && metricsData.length > 0) {
        const m = metricsData[0];
        setMetrics({
          totalSent: m.total_sent,
          pendingCount: m.pending_count,
          acceptedCount: m.accepted_count,
          declinedCount: m.declined_count,
          unsentCount: m.unsent_count,
          entitiesWithAgents: m.entities_with_agents
        });
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (entityId: string, agentEmail: string, message?: string) => {
    if (!user) return;

    try {
      // Generate invitation token
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_agent_invitation_token');

      if (tokenError) throw tokenError;

      const { data, error } = await supabase
        .from('agent_invitations')
        .insert({
          entity_id: entityId,
          entity_owner_id: user.id,
          agent_email: agentEmail,
          token: tokenData,
          message,
        })
        .select(`
          *,
          entity:entities(id, name, type, state)
        `)
        .single();

      if (error) throw error;

      setInvitations(prev => [data as AgentInvitation, ...prev]);
      
      // Refresh metrics
      fetchInvitations();
      
      toast({
        title: "Invitation Sent",
        description: "Agent invitation sent successfully"
      });
      return data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
      throw error;
    }
  };

  const respondToInvitation = async (token: string, response: 'accepted' | 'declined') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agent_invitations')
        .update({ 
          status: response,
        responded_at: new Date().toISOString()
        })
        .eq('token', token)
        .select(`
          *,
          entity:entities(id, name, type, state)
        `)
        .single();

      if (error) throw error;

      // If accepted, create entity-agent assignment
      if (response === 'accepted') {
        const { error: assignmentError } = await supabase
          .from('entity_agent_assignments')
          .insert({
            entity_id: data.entity_id,
            agent_id: data.agent_id,
            status: 'accepted',
            responded_at: new Date().toISOString()
          });

        if (assignmentError) throw assignmentError;
      }

      setInvitations(prev =>
        prev.map(inv => 
          inv.token === token ? { ...inv, status: response } : inv
        )
      );

      // Refresh metrics
      fetchInvitations();

      toast({
        title: "Success",
        description: `Invitation ${response} successfully`
      });
      return data;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        title: "Error", 
        description: "Failed to respond to invitation",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getInvitationByToken = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_invitations')
        .select(`
          *,
          entity:entities(id, name, type, state),
          agent:agents(id, company_name, contact_email)
        `)
        .eq('token', token)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      return null;
    }
  };

  const unsendInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agent_invitations')
        .update({
          unsent_at: new Date().toISOString(),
          unsent_by: user.id,
          status: 'unsent'
        })
        .eq('id', invitationId)
        .eq('status', 'pending') // Only allow unsending pending invitations
        .select()
        .single();

      if (error) throw error;

      setInvitations(prev =>
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: 'unsent' as any, unsent_at: new Date().toISOString() }
            : inv
        )
      );

      // Refresh metrics
      fetchInvitations();

      toast({
        title: "Invitation Unsent",
        description: "The invitation has been successfully cancelled"
      });
      return data;
    } catch (error) {
      console.error('Error unsending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to unsend invitation",
        variant: "destructive"
      });
      throw error;
    }
  };

  const markInvitationViewed = async (token: string) => {
    try {
      const { error } = await supabase
        .from('agent_invitations')
        .update({ viewed_at: new Date().toISOString() })
        .eq('token', token);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking invitation as viewed:', error);
    }
  };

  useEffect(() => {
    fetchInvitations();
    
    // Set up real-time subscription for invitations
    const channel = supabase
      .channel('agent-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_invitations',
          filter: `entity_owner_id=eq.${user?.id}`
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    invitations,
    loading,
    metrics,
    sendInvitation,
    respondToInvitation,
    unsendInvitation,
    markInvitationViewed,
    getInvitationByToken,
    refetch: fetchInvitations,
  };
};