import React from 'react';
import { EntityList } from './EntityList';
import { useTeams } from '@/hooks/useTeams';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { Entity } from '@/types/entity';

interface TeamAwareEntityListProps {
  entities: Entity[];
  onDelete: (id: string) => void;
}

export const TeamAwareEntityList: React.FC<TeamAwareEntityListProps> = ({ 
  entities, 
  onDelete 
}) => {
  const { currentTeam, teams, getUserRole } = useTeams();

  // Filter entities based on current context
  const contextEntities = currentTeam 
    ? entities.filter(entity => entity.team_id === currentTeam.id)
    : entities.filter(entity => !entity.team_id);

  const getEntityContext = (entity: Entity) => {
    if (entity.team_id) {
      const team = teams.find(t => t.id === entity.team_id);
      const userRole = team ? getUserRole(team.id) : null;
      return { team, userRole };
    }
    return null;
  };

  const EntityListWithTeamInfo = ({ entities: entitiesToShow }: { entities: Entity[] }) => (
    <div className="space-y-4">
      {entitiesToShow.map((entity) => {
        const context = getEntityContext(entity);
        
        return (
          <div key={entity.id} className="space-y-2">
            {context && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Team: {context.team?.name}</span>
                {context.userRole && (
                  <Badge variant="outline" className="text-xs">
                    {context.userRole}
                  </Badge>
                )}
              </div>
            )}
            {/* The actual EntityList component will handle the entity display */}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {currentTeam && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Users className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              {currentTeam.name} Entities
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              {contextEntities.length} entities in this team
            </p>
          </div>
        </div>
      )}

      <EntityList 
        entities={contextEntities} 
        onDelete={onDelete}
      />
      
      {contextEntities.length === 0 && currentTeam && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No entities in {currentTeam.name} yet.</p>
          <p className="text-sm">Create an entity to get started.</p>
        </div>
      )}
    </div>
  );
};