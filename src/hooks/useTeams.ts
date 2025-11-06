import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Team, TeamMembership, TeamInvitation } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchTeams = async () => {
    if (!user) {
      setTeams([]);
      setMemberships([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Get teams user belongs to
      const { data: teamMemberships, error: membershipsError } = await supabase
        .from('team_memberships')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('user_id', user.id);

      if (membershipsError) throw membershipsError;

      const membershipData = (teamMemberships || []) as any[];
      setMemberships(membershipData);
      
      const teamsData = membershipData
        .filter(m => m.team)
        .map(m => m.team) as Team[];
      
      setTeams(teamsData);

      // Set current team if not set and teams available
      if (!currentTeam && teamsData.length > 0) {
        setCurrentTeam(teamsData[0]);
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load teams');
      setError(error);
      console.error('Error fetching teams:', err);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      // Get user's email first
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return;

      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          team:teams(*),
          inviter:profiles!invited_by(first_name, last_name, email)
        `)
        .eq('email', authUser.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setInvitations((data || []) as any[]);

    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const createTeam = async (name: string, description?: string) => {
    if (!user) return;

    try {
      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner
      const { error: membershipError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner'
        });

      if (membershipError) throw membershipError;

      // Refresh teams
      await fetchTeams();
      
      toast.success('Team created successfully');
      return team;

    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
      throw error;
    }
  };

  const inviteTeamMember = async (teamId: string, email: string, role: 'admin' | 'manager' | 'member' = 'member') => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          team_id: teamId,
          email,
          role
        }
      });

      if (error) throw error;
      
      toast.success('Invitation sent successfully');
      await fetchInvitations();

    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
      throw error;
    }
  };

  const acceptInvitation = async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('accept-team-invitation', {
        body: { token }
      });

      if (error) throw error;
      
      toast.success('Invitation accepted successfully');
      await fetchTeams();
      await fetchInvitations();

    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
      throw error;
    }
  };

  const updateMemberRole = async (membershipId: string, newRole: 'admin' | 'manager' | 'member') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;
      
      toast.success('Member role updated');
      await fetchTeams();

    } catch (error) {
      console.error('Error updating member role:', error);
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
      
      toast.success('Member removed from team');
      await fetchTeams();

    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
      throw error;
    }
  };

  const leaveTeam = async (teamId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Left team successfully');
      
      // If leaving current team, switch to another team or clear
      if (currentTeam?.id === teamId) {
        const remainingTeams = teams.filter(t => t.id !== teamId);
        setCurrentTeam(remainingTeams.length > 0 ? remainingTeams[0] : null);
      }
      
      await fetchTeams();

    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
      throw error;
    }
  };

  const getUserRole = (teamId: string) => {
    const membership = memberships.find(m => m.team_id === teamId);
    return membership?.role || null;
  };

  const hasPermission = (teamId: string, requiredRole: 'owner' | 'admin' | 'manager' | 'member') => {
    const userRole = getUserRole(teamId);
    if (!userRole) return false;

    const roleHierarchy = ['member', 'manager', 'admin', 'owner'];
    const userRoleLevel = roleHierarchy.indexOf(userRole);
    const requiredRoleLevel = roleHierarchy.indexOf(requiredRole);
    
    return userRoleLevel >= requiredRoleLevel;
  };

  useEffect(() => {
    fetchTeams();
    fetchInvitations();

    // Set up real-time subscription for team changes
    const teamsChannel = supabase
      .channel('team-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_memberships',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchTeams();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_invitations',
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
    };
  }, [user]);

  return {
    teams,
    currentTeam,
    setCurrentTeam,
    memberships,
    invitations,
    loading,
    error,
    createTeam,
    inviteTeamMember,
    acceptInvitation,
    updateMemberRole,
    removeMember,
    leaveTeam,
    getUserRole,
    hasPermission,
    refetch: fetchTeams,
  };
};