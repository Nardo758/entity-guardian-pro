import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail } from 'lucide-react';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

interface EntityDetailsCardProps {
  entity: Entity;
}

export const EntityDetailsCard: React.FC<EntityDetailsCardProps> = ({ entity }) => {
  const entityFee = stateRequirements[entity.state][entity.type].fee;
  const stateName = stateRequirements[entity.state].name;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Entity Info Card */}
      <Card className="bg-gradient-to-br from-card to-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              🏢 {entity.name}
            </Badge>
            <span className="text-muted-foreground text-sm">
              {entity.type.toUpperCase()} - {stateName}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-2">REGISTERED AGENT</h4>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{entity.registered_agent_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{entity.registered_agent_email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{entity.registered_agent_phone || 'No phone provided'}</span>
              </div>
              {entity.registered_agent_fee && (
                <div className="mt-2">
                  <span className="text-sm font-medium text-info">
                    ${entity.registered_agent_fee}/year
                  </span>
                </div>
              )}
            </div>
          </div>

          {entity.independent_director_name && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">INDEPENDENT DIRECTOR</h4>
              <div className="space-y-1">
                <p className="font-medium text-foreground">{entity.independent_director_name}</p>
                {entity.independent_director_email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{entity.independent_director_email}</span>
                  </div>
                )}
                {entity.independent_director_phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{entity.independent_director_phone}</span>
                  </div>
                )}
                {entity.independent_director_fee && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-info">
                      ${entity.independent_director_fee}/year
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-foreground mb-2">FORMATION DATE</h4>
            <p className="text-muted-foreground">
              {new Date(entity.formation_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Annual Entity Fee Card */}
      <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-success text-lg">Annual Entity Fee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-success mb-2">
              ${entityFee.toFixed(2)}
            </div>
            <p className="text-success/70 font-medium">
              {stateName} state fee
            </p>
            <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
              <p className="text-sm text-success font-medium">
                Due: {new Date(entity.formation_date).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};