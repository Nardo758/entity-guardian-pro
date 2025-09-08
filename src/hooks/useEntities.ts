import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Entity, EntityFilters, BulkOperation } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useEntities = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EntityFilters>({});
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
      setEntities((data || []) as Entity[]);
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

  const updateEntity = async (id: string, updates: Partial<Entity>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setEntities(prev => prev.map(entity => 
        entity.id === id ? { ...entity, ...updates } : entity
      ));
      toast.success('Entity updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating entity:', error);
      toast.error('Failed to update entity');
      throw error;
    }
  };

  const bulkOperation = async (operation: BulkOperation) => {
    if (!user || operation.entityIds.length === 0) return;

    try {
      let query = supabase.from('entities');
      let updates: Partial<Entity> = {};

      switch (operation.type) {
        case 'delete':
          const { error: deleteError } = await supabase
            .from('entities')
            .delete()
            .in('id', operation.entityIds)
            .eq('user_id', user.id);

          if (deleteError) throw deleteError;
          
          setEntities(prev => prev.filter(entity => !operation.entityIds.includes(entity.id)));
          toast.success(`${operation.entityIds.length} entities deleted successfully`);
          return;

        case 'updateStatus':
          updates.status = operation.value;
          break;

        case 'archive':
          updates.status = 'archived';
          break;

        case 'updateTags':
          // For tags, we need to handle each entity individually to merge tags
          for (const entityId of operation.entityIds) {
            const entity = entities.find(e => e.id === entityId);
            if (entity) {
              const existingTags = entity.tags || [];
              const newTags = [...new Set([...existingTags, ...operation.value])];
              await supabase
                .from('entities')
                .update({ tags: newTags })
                .eq('id', entityId)
                .eq('user_id', user.id);
            }
          }
          
          setEntities(prev => prev.map(entity => 
            operation.entityIds.includes(entity.id)
              ? { ...entity, tags: [...new Set([...(entity.tags || []), ...operation.value])] }
              : entity
          ));
          toast.success(`Tags updated for ${operation.entityIds.length} entities`);
          return;

        case 'setPriority':
          updates.priority = operation.value;
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      const { error } = await supabase
        .from('entities')
        .update(updates)
        .in('id', operation.entityIds)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntities(prev => prev.map(entity =>
        operation.entityIds.includes(entity.id)
          ? { ...entity, ...updates }
          : entity
      ));

      toast.success(`${operation.entityIds.length} entities updated successfully`);
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      toast.error('Failed to perform bulk operation');
      throw error;
    }
  };

  const applyFilters = (entities: Entity[], filters: EntityFilters): Entity[] => {
    return entities.filter(entity => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          entity.name.toLowerCase().includes(searchLower) ||
          entity.type.toLowerCase().includes(searchLower) ||
          entity.state.toLowerCase().includes(searchLower) ||
          entity.registered_agent_name?.toLowerCase().includes(searchLower) ||
          entity.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // State filter
      if (filters.states?.length && !filters.states.includes(entity.state)) {
        return false;
      }

      // Type filter
      if (filters.types?.length && !filters.types.includes(entity.type)) {
        return false;
      }

      // Status filter
      if (filters.statuses?.length && !filters.statuses.includes(entity.status || 'active')) {
        return false;
      }

      // Compliance status filter
      if (filters.complianceStatuses?.length && 
          !filters.complianceStatuses.includes(entity.compliance_status || 'compliant')) {
        return false;
      }

      // Priority filter
      if (filters.priorities?.length && 
          !filters.priorities.includes(entity.priority || 3)) {
        return false;
      }

      // Tags filter
      if (filters.tags?.length) {
        const entityTags = entity.tags || [];
        const hasMatchingTag = filters.tags.some(tag => 
          entityTags.some(entityTag => 
            entityTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  };

  // Apply filters whenever entities or filters change
  useEffect(() => {
    const filtered = applyFilters(entities, filters);
    setFilteredEntities(filtered);
  }, [entities, filters]);

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
    entities: filteredEntities,
    allEntities: entities,
    loading,
    filters,
    addEntity,
    updateEntity,
    deleteEntity,
    bulkOperation,
    setFilters,
    refetch: fetchEntities,
  };
};