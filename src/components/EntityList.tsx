import React from 'react';
import { Mail, Phone, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

interface EntityListProps {
  entities: Entity[];
  onDelete: (id: number) => void;
}

export const EntityList: React.FC<EntityListProps> = ({ entities, onDelete }) => {
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
                  <h3 className="text-lg font-semibold text-foreground">
                    {entity.name}
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
                      <div className="font-medium">{entity.registeredAgent.name}</div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {entity.registeredAgent.email}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {entity.registeredAgent.phone}
                      </div>
                      <div className="font-semibold text-success">
                        ${entity.registeredAgent.fee}/year
                      </div>
                    </div>
                  </div>

                  {/* Independent Director (Delaware) */}
                  {entity.state === 'DE' && entity.independentDirector.name && (
                    <div className="rounded-lg bg-info-muted p-4 border border-info/10">
                      <h4 className="font-medium text-info mb-2">Independent Director</h4>
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">{entity.independentDirector.name}</div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {entity.independentDirector.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {entity.independentDirector.phone}
                        </div>
                        <div className="font-semibold text-success">
                          ${entity.independentDirector.fee}/year
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Entity Fee Info */}
                  {(!entity.independentDirector.name || entity.state !== 'DE') && (
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
};