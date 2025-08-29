import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  settings?: any;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  joined_at: string;
  created_at: string;
  updated_at: string;
  invited_by?: string;
  // Profile information
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  token: string;
  invited_by: string;
  created_at: string;
  accepted_at?: string;
  expires_at: string;
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTeams = async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          teams!inner (*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const userTeams = data?.map(item => (item as any).teams).filter(Boolean) || [];
      setTeams(userTeams);
      
      // Set first team as current if none selected
      if (userTeams.length > 0 && !currentTeam) {
        setCurrentTeam(userTeams[0]);
      }
    } catch (error) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      toast.error('Failed to load team members');
    }
  };

  const fetchTeamInvitations = async (teamId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null);

      if (error) throw error;
      setTeamInvitations(data || []);
    } catch (error) {
      toast.error('Failed to load team invitations');
    }
  };

  const createTeam = async (teamData: Pick<Team, 'name' | 'description'>) => {
    if (!user) return;

    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          ...teamData,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      await fetchTeams();
      toast.success('Team created successfully');
      return team;
    } catch (error) {
      toast.error('Failed to create team');
      throw error;
    }
  };

  const inviteTeamMember = async (teamId: string, email: string, role: TeamMember['role']) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email,
          role,
          invited_by: user.id,
          token: crypto.randomUUID()
        });

      if (error) throw error;

      await fetchTeamInvitations(teamId);
      toast.success(`Invitation sent to ${email}`);
    } catch (error) {
      toast.error('Failed to send invitation');
      throw error;
    }
  };

  const updateMemberRole = async (membershipId: string, role: TeamMember['role']) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .update({ role })
        .eq('id', membershipId);

      if (error) throw error;

      if (currentTeam) {
        await fetchTeamMembers(currentTeam.id);
      }
      toast.success('Member role updated');
    } catch (error) {
      toast.error('Failed to update member role');
      throw error;
    }
  };

  const removeMember = async (membershipId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;

      if (currentTeam) {
        await fetchTeamMembers(currentTeam.id);
      }
      toast.success('Member removed from team');
    } catch (error) {
      toast.error('Failed to remove member');
      throw error;
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  useEffect(() => {
    if (currentTeam) {
      fetchTeamMembers(currentTeam.id);
      fetchTeamInvitations(currentTeam.id);
    }
  }, [currentTeam]);

  return {
    teams,
    currentTeam,
    setCurrentTeam,
    teamMembers,
    teamInvitations,
    loading,
    createTeam,
    inviteTeamMember,
    updateMemberRole,
    removeMember,
    refetch: fetchTeams,
  };
};