import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  assigned_admin_name?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  ticket_count: number;
}

export const useAdminSupportTickets = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch admin users for assignment
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users-for-assignment'],
    queryFn: async () => {
      // Get admin accounts
      const { data: admins, error } = await supabase
        .from('admin_accounts')
        .select('id, email, display_name')
        .eq('is_active', true);

      if (error) throw error;

      // Get ticket counts per admin
      const { data: ticketCounts } = await supabase
        .from('support_tickets')
        .select('assigned_to')
        .not('assigned_to', 'is', null)
        .in('status', ['open', 'in_progress']);

      const countMap = new Map<string, number>();
      ticketCounts?.forEach(t => {
        if (t.assigned_to) {
          countMap.set(t.assigned_to, (countMap.get(t.assigned_to) || 0) + 1);
        }
      });

      return (admins || []).map(admin => ({
        ...admin,
        ticket_count: countMap.get(admin.id) || 0,
      })) as AdminUser[];
    },
  });

  const { data: tickets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-support-tickets', statusFilter, priorityFilter, assigneeFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          query = query.is('assigned_to', null);
        } else {
          query = query.eq('assigned_to', assigneeFilter);
        }
      }

      if (searchTerm) {
        query = query.or(`subject.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user info and admin assignment info for each ticket
      const ticketsWithUsers = await Promise.all(
        (data || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', ticket.user_id)
            .single();

          // Get assigned admin name
          let assigned_admin_name = null;
          if (ticket.assigned_to) {
            const { data: admin } = await supabase
              .from('admin_accounts')
              .select('display_name')
              .eq('id', ticket.assigned_to)
              .single();
            assigned_admin_name = admin?.display_name || null;
          }

          return {
            ...ticket,
            user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
            assigned_admin_name,
          };
        })
      );

      return ticketsWithUsers as SupportTicket[];
    },
  });

  const { data: ticketStats } = useQuery({
    queryKey: ['admin-support-ticket-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, priority');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        open: data?.filter(t => t.status === 'open').length || 0,
        inProgress: data?.filter(t => t.status === 'in_progress').length || 0,
        resolved: data?.filter(t => t.status === 'resolved').length || 0,
        closed: data?.filter(t => t.status === 'closed').length || 0,
        highPriority: data?.filter(t => t.priority === 'high' || t.priority === 'urgent').length || 0,
      };

      return stats;
    },
  });

  const fetchTicketMessages = useCallback(async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as TicketMessage[];
  }, []);

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Partial<SupportTicket> }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket-stats'] });
      toast({ title: 'Ticket updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update ticket', description: error.message, variant: 'destructive' });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message, isInternal }: { ticketId: string; message: string; isInternal: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          sender_type: 'admin',
          message,
          is_internal: isInternal,
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notification if not an internal note
      if (!isInternal) {
        try {
          await supabase.functions.invoke('send-support-notification', {
            body: { ticketId, message, isResolution: false },
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the mutation if email fails
        }
      }

      return data;
    },
    onSuccess: () => {
      toast({ title: 'Message sent successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    },
  });

  const resolveTicketMutation = useMutation({
    mutationFn: async ({ ticketId, resolutionNotes }: { ticketId: string; resolutionNotes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: resolutionNotes,
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Send resolution email notification
      try {
        await supabase.functions.invoke('send-support-notification', {
          body: { ticketId, message: resolutionNotes, isResolution: true },
        });
      } catch (emailError) {
        console.error('Failed to send resolution email:', emailError);
        // Don't fail the mutation if email fails
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-ticket-stats'] });
      toast({ title: 'Ticket resolved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to resolve ticket', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tickets,
    ticketStats,
    adminUsers,
    isLoading,
    error,
    refetch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    searchTerm,
    setSearchTerm,
    fetchTicketMessages,
    updateTicket: updateTicketMutation.mutate,
    sendMessage: sendMessageMutation.mutate,
    resolveTicket: resolveTicketMutation.mutate,
    isUpdating: updateTicketMutation.isPending,
    isSending: sendMessageMutation.isPending,
    isResolving: resolveTicketMutation.isPending,
  };
};
