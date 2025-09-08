import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Agent, AgentSearchFilters } from '@/types/agent';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAgents = async (filters?: AgentSearchFilters) => {
    try {
      let query = supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.state) {
        query = query.contains('states', [filters.state]);
      }
      
      if (filters?.maxPrice) {
        query = query.lte('price_per_entity', filters.maxPrice);
      }
      
      if (filters?.minExperience) {
        query = query.gte('years_experience', filters.minExperience);
      }
      
      if (filters?.availableOnly) {
        query = query.eq('is_available', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAgents((data || []) as Agent[]);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load registered agents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents for directory browsing - returns only non-sensitive data
  const fetchAgentsDirectory = async (filters?: AgentSearchFilters) => {
    try {
      // Query the agents table but only select non-sensitive fields
      // RLS will ensure users only see agents they have relationships with
      let query = supabase
        .from('agents')
        .select(`
          id,
          user_id,
          company_name,
          bio,
          states,
          is_available,
          years_experience,
          created_at,
          updated_at
        `)
        .eq('is_available', true) // Only show available agents in directory
        .order('created_at', { ascending: false });

      if (filters?.state) {
        query = query.contains('states', [filters.state]);
      }
      
      if (filters?.minExperience) {
        query = query.gte('years_experience', filters.minExperience);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match Agent interface, excluding sensitive fields
      const agentData = (data || []).map(agent => ({
        ...agent,
        contact_email: '', // Hide sensitive contact info
        price_per_entity: 0, // Hide pricing in directory view
      })) as Agent[];
      
      setAgents(agentData);
    } catch (error) {
      console.error('Error fetching agents directory:', error);
      toast.error('Failed to load registered agents directory. You may need to create business relationships first.');
    } finally {
      setLoading(false);
    }
  };

  const createAgentProfile = async (agentData: Partial<Omit<Agent, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & Pick<Agent, 'states' | 'is_available'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          ...agentData,
          user_id: user.id,
          price_per_entity: 199, // Default price, can be updated later
        })
        .select()
        .single();

      if (error) throw error;

      // Update user profile to indicate they're a registered agent
      await supabase
        .from('profiles')
        .update({ user_type: 'registered_agent' })
        .eq('user_id', user.id);

      toast.success('Agent profile created successfully');
      return data;
    } catch (error) {
      console.error('Error creating agent profile:', error);
      toast.error('Failed to create agent profile');
      throw error;
    }
  };

  const updateAgentProfile = async (agentId: string, updates: Partial<Agent>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setAgents(prev => 
        prev.map(agent => 
          agent.id === agentId ? { ...agent, ...updates } : agent
        )
      );

      toast.success('Agent profile updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating agent profile:', error);
      toast.error('Failed to update agent profile');
      throw error;
    }
  };

  const getUserAgent = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Agent | null;
    } catch (error) {
      console.error('Error fetching user agent profile:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    fetchAgents,
    fetchAgentsDirectory,
    createAgentProfile,
    updateAgentProfile,
    getUserAgent,
    refetch: fetchAgents,
  };
};