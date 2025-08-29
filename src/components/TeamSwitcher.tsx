import React from 'react';
import { useTeams } from '@/hooks/useTeams';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Plus, User, Crown, Shield, UserCheck } from 'lucide-react';
import { TeamRole } from '@/types/entity';

export const TeamSwitcher = () => {
  const { teams, currentTeam, setCurrentTeam, getUserRole, loading } = useTeams();

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin': return <Shield className="h-3 w-3 text-red-500" />;
      case 'manager': return <UserCheck className="h-3 w-3 text-blue-500" />;
      case 'member': return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  if (loading || teams.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={currentTeam?.id || 'personal'} 
        onValueChange={(value) => {
          if (value === 'personal') {
            setCurrentTeam(null);
          } else {
            const team = teams.find(t => t.id === value);
            if (team) setCurrentTeam(team as any);
          }
        }}
      >
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="personal">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              Personal
            </div>
          </SelectItem>
          {teams.map((team) => {
            const userRole = getUserRole(team.id);
            return (
              <SelectItem key={team.id} value={team.id}>
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  <span>{team.name}</span>
                  {userRole && getRoleIcon(userRole)}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {currentTeam && (
        <Badge variant="outline" className="text-xs">
          Team
        </Badge>
      )}
    </div>
  );
};