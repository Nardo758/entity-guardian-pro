import React, { useState } from 'react';
import { useTeams } from '@/hooks/useTeams';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Settings, 
  UserPlus, 
  Crown, 
  Shield, 
  UserCheck, 
  User,
  Mail,
  Trash2,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { TeamRole, TeamMembership } from '@/types/entity';
import { toast } from 'sonner';

export const TeamManagement = () => {
  const {
    teams,
    currentTeam,
    setCurrentTeam,
    memberships,
    invitations,
    loading,
    createTeam,
    inviteTeamMember,
    acceptInvitation,
    updateMemberRole,
    removeMember,
    leaveTeam,
    getUserRole,
    hasPermission
  } = useTeams();

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member');

  const currentTeamMemberships = memberships.filter(m => m.team_id === currentTeam?.id);
  const userRole = currentTeam ? getUserRole(currentTeam.id) : null;

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-red-500" />;
      case 'manager': return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'member': return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'member': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    try {
        const team = await createTeam(newTeamName, newTeamDescription);
        if (team) {
          setCurrentTeam(team as any);
          setShowCreateTeam(false);
          setNewTeamName('');
          setNewTeamDescription('');
        }
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!currentTeam) {
      toast.error('No team selected');
      return;
    }

    try {
      await inviteTeamMember(currentTeam.id, inviteEmail, inviteRole);
      setShowInviteMember(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: 'admin' | 'manager' | 'member') => {
    try {
      await updateMemberRole(membershipId, newRole);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) return;
    
    try {
      await removeMember(membershipId);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentTeam) return;
    
    if (!confirm(`Are you sure you want to leave the ${currentTeam.name} team?`)) return;
    
    try {
      await leaveTeam(currentTeam.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage your teams and collaborate with others</p>
        </div>
        
        <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team to collaborate with others on entity management.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="team-description">Description (Optional)</Label>
                <Textarea
                  id="team-description"
                  placeholder="Describe your team's purpose"
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateTeam} className="flex-1">
                  Create Team
                </Button>
                <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Selector */}
      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select 
                value={currentTeam?.id} 
                onValueChange={(value) => {
                  const team = teams.find(t => t.id === value);
                  if (team) setCurrentTeam(team);
                }}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(getUserRole(team.id) || 'member')}
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentTeam && userRole && (
                <Badge variant="outline" className={getRoleColor(userRole)}>
                  {getRoleIcon(userRole)}
                  <span className="ml-1 capitalize">{userRole}</span>
                </Badge>
              )}
            </div>
            
            {currentTeam?.description && (
              <p className="text-sm text-muted-foreground mt-2">
                {currentTeam.description}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      {currentTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Manage members and their roles in {currentTeam.name}
                </CardDescription>
              </div>
              
              {hasPermission(currentTeam.id, 'admin') && (
                <Dialog open={showInviteMember} onOpenChange={setShowInviteMember}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join {currentTeam.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="Enter email address"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="invite-role">Role</Label>
                        <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">
                              <div className="flex items-center gap-2">
                                {getRoleIcon('member')}
                                Member
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div className="flex items-center gap-2">
                                {getRoleIcon('manager')}
                                Manager
                              </div>
                            </SelectItem>
                            {hasPermission(currentTeam.id, 'owner') && (
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  {getRoleIcon('admin')}
                                  Admin
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleInviteMember} className="flex-1">
                          Send Invitation
                        </Button>
                        <Button variant="outline" onClick={() => setShowInviteMember(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentTeamMemberships.map((membership) => (
                <div key={membership.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {membership.user_profile?.first_name} {membership.user_profile?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {membership.user_profile?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {hasPermission(currentTeam.id, 'admin') && membership.role !== 'owner' ? (
                      <Select 
                        value={membership.role} 
                        onValueChange={(value: any) => handleRoleChange(membership.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          {hasPermission(currentTeam.id, 'owner') && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={getRoleColor(membership.role)}>
                        {getRoleIcon(membership.role)}
                        <span className="ml-1 capitalize">{membership.role}</span>
                      </Badge>
                    )}
                    
                    {hasPermission(currentTeam.id, 'admin') && membership.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(membership.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {userRole && userRole !== 'owner' && (
              <>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeaveTeam}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Team
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Invitations you've received to join teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div>
                    <p className="font-medium">{invitation.team?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited as {invitation.role} by {invitation.inviter?.first_name} {invitation.inviter?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => acceptInvitation(invitation.token)}
                    size="sm"
                  >
                    Accept Invitation
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Teams Message */}
      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to start collaborating with others.
            </p>
            <Button onClick={() => setShowCreateTeam(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};