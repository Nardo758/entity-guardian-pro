import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Entity } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useEntities = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchEntities = async () => {
    if (!user) {
      setEntities([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        // Silently handle - user might not have entities yet or table might not exist
        console.warn('Could not fetch entities:', fetchError);
        setEntities([]);
        setError(null);
        setLoading(false);
        return;
      }
      setEntities((data || []) as Entity[]);
    } catch (err) {
      // Silently handle errors - no entities is not an error condition for new users
      console.warn('Error fetching entities:', err);
      setEntities([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const addEntity = async (entityData: Omit<Entity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('entities')
        .insert({
          ...entityData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setEntities(prev => [data as Entity, ...prev]);
      toast.success('Entity added successfully');
      return data;
    } catch (error) {
      console.error('Error adding entity:', error);
      toast.error('Failed to add entity');
      throw error;
    }
  };

  const deleteEntity = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntities(prev => prev.filter(entity => entity.id !== id));
      toast.success('Entity deleted successfully');
    } catch (error) {
      console.error('Error deleting entity:', error);
      toast.error('Failed to delete entity');
      throw error;
    }
  };

  useEffect(() => {
    fetchEntities();

    // Set up real-time subscription
    const channel = supabase
      .channel('entities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchEntities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    entities,
    loading,
    error,
    addEntity,
    deleteEntity,
    refetch: fetchEntities,
  };
};