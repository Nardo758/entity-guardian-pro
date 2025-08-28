import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Entity } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useEntities = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchEntities = async () => {
    if (!user) {
      setEntities([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntities((data || []).map(entity => ({...entity, type: entity.type as Entity['type']})) as Entity[]);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast.error('Failed to load entities');
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

      setEntities(prev => [{ ...data, type: data.type as Entity['type'] } as Entity, ...prev]);
      toast.success('Entity added successfully');
      return { ...data, type: data.type as Entity['type'] } as Entity;
    } catch (error) {
      console.error('Error adding entity:', error);
      toast.error('Failed to add entity');
      throw error;
    }
  };

  const updateEntity = async (id: string, entityData: Partial<Omit<Entity, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('entities')
        .update(entityData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setEntities(prev => prev.map(entity => 
        entity.id === id ? { ...data, type: data.type as Entity['type'] } as Entity : entity
      ));
      toast.success('Entity updated successfully');
      return { ...data, type: data.type as Entity['type'] } as Entity;
    } catch (error) {
      console.error('Error updating entity:', error);
      toast.error('Failed to update entity');
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

  const getEntity = useCallback(async (id: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { ...data, type: data.type as Entity['type'] } as Entity;
    } catch (error) {
      console.error('Error fetching entity:', error);
      return null;
    }
  }, [user]);

  return {
    entities,
    loading,
    addEntity,
    updateEntity,
    deleteEntity,
    getEntity,
    refetch: fetchEntities,
  };
};