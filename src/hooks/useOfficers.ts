import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Officer {
  id: string;
  entity_id: string;
  user_id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  address?: string;
  appointment_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useOfficers = (entityId?: string) => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOfficers = useCallback(async () => {
    if (!user || !entityId) {
      setOfficers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOfficers((data || []) as Officer[]);
    } catch (error) {
      console.error('Error fetching officers:', error);
      toast.error('Failed to load officers');
    } finally {
      setLoading(false);
    }
  }, [user, entityId]);

  const addOfficer = async (officerData: Omit<Officer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('officers')
        .insert({
          ...officerData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setOfficers(prev => [data as Officer, ...prev]);
      toast.success('Officer added successfully');
      return data as Officer;
    } catch (error) {
      console.error('Error adding officer:', error);
      toast.error('Failed to add officer');
      throw error;
    }
  };

  const updateOfficer = async (id: string, officerData: Partial<Omit<Officer, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('officers')
        .update(officerData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setOfficers(prev => prev.map(officer => 
        officer.id === id ? data as Officer : officer
      ));
      toast.success('Officer updated successfully');
      return data as Officer;
    } catch (error) {
      console.error('Error updating officer:', error);
      toast.error('Failed to update officer');
      throw error;
    }
  };

  const deleteOfficer = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('officers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setOfficers(prev => prev.filter(officer => officer.id !== id));
      toast.success('Officer removed successfully');
    } catch (error) {
      console.error('Error deleting officer:', error);
      toast.error('Failed to remove officer');
      throw error;
    }
  };

  useEffect(() => {
    fetchOfficers();

    // Set up real-time subscription
    const channel = supabase
      .channel('officers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'officers',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchOfficers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOfficers, user]);

  return {
    officers,
    loading,
    addOfficer,
    updateOfficer,
    deleteOfficer,
    refetch: fetchOfficers,
  };
};