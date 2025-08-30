import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentInvitation } from '@/types/agent';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAgentInvitations = () => {
  const [invitations, setInvitations] = useState<AgentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvitations = async () => {
    if (!user) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('agent_invitations')
        .select(`
          *,
          entity:entities(id, name, type, state),
          agent:agents(id, company_name, contact_email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data || []) as AgentInvitation[]);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
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
      toast.success('Invitation sent successfully');
      return data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
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

      toast.success(`Invitation ${response} successfully`);
      return data;
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast.error('Failed to respond to invitation');
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
      return data as AgentInvitation;
    } catch (error) {
      console.error('Error fetching invitation:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  return {
    invitations,
    loading,
    sendInvitation,
    respondToInvitation,
    getInvitationByToken,
    refetch: fetchInvitations,
  };
};