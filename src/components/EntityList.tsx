import React, { memo, useCallback } from 'react';
import { Mail, Phone, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';
import { useNavigate } from 'react-router-dom';

interface EntityListProps {
  entities: Entity[];
  onDelete: (id: string) => void;
}

export const EntityList = memo<EntityListProps>(({ entities, onDelete }) => {
  const navigate = useNavigate();
  
  if (entities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto max-w-sm">
          <div className="rounded-full bg-muted p-8 w-fit mx-auto mb-4">
            <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No entities yet</h3>
          <p className="text-muted-foreground">
            Add your first business entity to get started with renewal management.
          </p>
        </div>
      </div>
    );
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sole_proprietorship: 'SOLE PROP',
      partnership: 'PARTNERSHIP',
      llc: 'LLC',
      c_corp: 'C-CORP',
      s_corp: 'S-CORP'
    };
    return labels[type] || type.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {entities.map((entity) => (
        <Card key={entity.id} className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h3 
                    className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer transition-colors flex items-center gap-2"
                    onClick={() => navigate(`/entity/${entity.id}`)}
                  >
                    {entity.name}
                    <ExternalLink className="h-4 w-4 opacity-60" />
                  </h3>
                  <Badge variant="secondary">
                    {getEntityTypeLabel(entity.type)} - {stateRequirements[entity.state].name}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Registered Agent */}
                  <div className="rounded-lg bg-primary-muted p-4 border border-primary/10">
                    <h4 className="font-medium text-primary mb-2">Registered Agent</h4>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{entity.registered_agent_name}</div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {entity.registered_agent_email}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {entity.registered_agent_phone}
                      </div>
                      <div className="font-semibold text-success">
                        ${entity.registered_agent_fee}/year
                      </div>
                    </div>
                  </div>

                  {/* Independent Director (Delaware) */}
                  {entity.state === 'DE' && entity.independent_director_name && (
                    <div className="rounded-lg bg-info-muted p-4 border border-info/10">
                      <h4 className="font-medium text-info mb-2">Independent Director</h4>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{entity.independent_director_name}</div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {entity.independent_director_email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {entity.independent_director_phone}
                        </div>
                        <div className="font-semibold text-success">
                          ${entity.independent_director_fee}/year
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Entity Fee Info */}
                  {(!entity.independent_director_name || entity.state !== 'DE') && (
                    <div className="rounded-lg bg-success-muted p-4 border border-success/10">
                      <h4 className="font-medium text-success mb-2">Annual Entity Fee</h4>
                      <div className="text-2xl font-bold text-success">
                        ${stateRequirements[entity.state][entity.type].fee}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stateRequirements[entity.state].name} state fee
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(entity.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive-muted"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

EntityList.displayName = 'EntityList';