import React from 'react';
import { Building, Plus, MoreVertical, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';
import { useNavigate } from 'react-router-dom';
import { EntityRegisteredAgentSection } from '@/components/EntityRegisteredAgentSection';

interface EntityPortfolioProps {
  entities: Entity[];
  onAddEntity: () => void;
  onDeleteEntity: (id: string) => void;
}

const EntityCard: React.FC<{
  entity: Entity;
  onDelete: (id: string) => void;
}> = ({ entity, onDelete }) => {
  const navigate = useNavigate();
  
  const entityFee = stateRequirements[entity.state]?.[entity.type]?.fee || 0;
  const totalAnnualFees = entityFee + (entity.registered_agent_fee || 0) + (entity.independent_director_fee || 0);

  const getEntityTypeColor = (type: string) => {
    const colors = {
      'llc': 'bg-blue-100 text-blue-800',
      'c_corp': 'bg-green-100 text-green-800',
      's_corp': 'bg-purple-100 text-purple-800',
      'partnership': 'bg-orange-100 text-orange-800',
      'sole_proprietorship': 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.llc;
  };

  const formatEntityType = (type: string) => {
    const types = {
      'llc': 'LLC',
      'c_corp': 'C-Corp',
      's_corp': 'S-Corp',
      'partnership': 'Partnership',
      'sole_proprietorship': 'Sole Proprietorship'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {entity.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs font-medium ${getEntityTypeColor(entity.type)}`}>
                  {formatEntityType(entity.type)}
                </Badge>
                <span className="text-sm text-muted-foreground">{entity.state}</span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/entity/${entity.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(entity.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Entity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">State Filing Fee</span>
            <span className="font-semibold text-foreground">${entityFee.toFixed(2)}</span>
          </div>

          {entity.registered_agent_fee > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-success/5 rounded-lg border border-success/10">
              <span className="text-sm text-muted-foreground">Registered Agent</span>
              <span className="font-semibold text-success">${entity.registered_agent_fee.toFixed(2)}/year</span>
            </div>
          )}

          {entity.independent_director_fee > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-info/5 rounded-lg border border-info/10">
              <span className="text-sm text-muted-foreground">Independent Director</span>
              <span className="font-semibold text-info">${entity.independent_director_fee.toFixed(2)}/year</span>
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total Annual Cost</span>
              <span className="text-lg font-bold text-foreground">${totalAnnualFees.toFixed(2)}</span>
            </div>
          </div>

          {/* Agent Assignment Section */}
          <div className="pt-3 border-t border-border/50">
            <EntityRegisteredAgentSection
              entityId={entity.id}
              entityState={entity.state}
              entityName={entity.name}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState: React.FC<{ onAddEntity: () => void }> = ({ onAddEntity }) => (
  <Card className="border-2 border-dashed border-border/50 bg-muted/10">
    <CardContent className="flex flex-col items-center justify-center py-16 px-6">
      <div className="p-4 bg-muted/20 rounded-full mb-4">
        <Building className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No entities in your portfolio
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
        Start building your business portfolio by adding your first entity. 
        Track renewals, manage compliance, and stay organized.
      </p>
      <Button onClick={onAddEntity} size="lg" className="font-medium">
        <Plus className="mr-2 h-4 w-4" />
        Add Your First Entity
      </Button>
    </CardContent>
  </Card>
);

export const EntityPortfolio: React.FC<EntityPortfolioProps> = ({
  entities,
  onAddEntity,
  onDeleteEntity
}) => {
  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-foreground">
            Entity Portfolio
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {entities.length} {entities.length === 1 ? 'entity' : 'entities'} in your business portfolio
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {entities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {entities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onDelete={onDeleteEntity}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAddEntity={onAddEntity} />
        )}
      </CardContent>
    </Card>
  );
};