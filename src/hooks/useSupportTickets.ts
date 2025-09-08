import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string;
  resolved_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const useSupportTickets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });

  const createTicket = useMutation({
    mutationFn: async (ticket: Omit<SupportTicket, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ...ticket,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Support ticket created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create support ticket');
      console.error('Error creating support ticket:', error);
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SupportTicket> }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update ticket');
      console.error('Error updating ticket:', error);
    },
  });

  return {
    tickets,
    isLoading,
    createTicket,
    updateTicket,
  };
};