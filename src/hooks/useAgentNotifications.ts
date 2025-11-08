import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AgentNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    agent_email?: string;
    entity_name?: string;
    invitation_status?: string;
    expires_at?: string;
  };
}

export const useAgentNotifications = () => {
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch regular notifications
      const { data: regularNotifications, error: regularError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (regularError) throw regularError;

      // Fetch agent invitation updates
      const { data: invitations, error: invitationsError } = await supabase
        .from('agent_invitations')
        .select(`
          *,
          entities!inner(name)
        `)
        .eq('entity_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      // Convert invitations to notifications
      const agentNotifications = (invitations || []).map(invitation => ({
        id: `agent_invitation_${invitation.id}`,
        type: `agent_invitation_${invitation.status}`,
        title: getInvitationTitle(invitation.status),
        message: getInvitationMessage(invitation),
        timestamp: invitation.updated_at,
        read: false, // Agent invitations are always marked as new
        metadata: {
          agent_email: invitation.agent_email,
          entity_name: invitation.entities?.name,
          invitation_status: invitation.status,
          expires_at: invitation.expires_at
        }
      }));

      // Combine and sort all notifications
      const allNotifications = [
        ...(regularNotifications || []).map(notif => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          timestamp: notif.created_at,
          read: notif.read,
          metadata: typeof notif.metadata === 'object' && notif.metadata !== null 
            ? notif.metadata as any 
            : undefined
        })),
        ...agentNotifications
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      // Silently handle errors - tables or data may not exist yet for new users
      console.warn('Could not fetch notifications (non-fatal):', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getInvitationTitle = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Agent Invitation Accepted';
      case 'declined':
        return 'Agent Invitation Declined';
      case 'pending':
        return 'Agent Invitation Pending';
      case 'expired':
        return 'Agent Invitation Expired';
      default:
        return 'Agent Invitation Update';
    }
  };

  const getInvitationMessage = (invitation: any) => {
    const entityName = invitation.entities?.name || 'your entity';
    
    switch (invitation.status) {
      case 'accepted':
        return `${invitation.agent_email} has accepted the registered agent invitation for ${entityName}`;
      case 'declined':
        return `${invitation.agent_email} has declined the registered agent invitation for ${entityName}`;
      case 'pending':
        const daysLeft = Math.ceil((new Date(invitation.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return `Invitation to ${invitation.agent_email} for ${entityName} is pending (expires in ${daysLeft} days)`;
      case 'expired':
        return `Invitation to ${invitation.agent_email} for ${entityName} has expired`;
      default:
        return `Invitation update for ${entityName}`;
    }
  };

  const markAsRead = async (id: string) => {
    if (id.startsWith('agent_invitation_')) {
      // For agent invitations, we don't mark as read in the database
      // Just update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for notifications
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Set up real-time subscription for agent invitations
    const invitationsChannel = supabase
      .channel('agent-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_invitations',
          filter: `entity_owner_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(invitationsChannel);
    };
  }, [user]);

  return {
    notifications,
    loading,
    markAsRead,
    refetch: fetchNotifications,
  };
};