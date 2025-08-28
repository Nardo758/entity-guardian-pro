import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

interface SimpleEntityCardProps {
  entity: Entity;
  onDelete?: (id: string) => void;
}

export const SimpleEntityCard: React.FC<SimpleEntityCardProps> = ({ entity, onDelete }) => {
  const entityFee = stateRequirements[entity.state][entity.type].fee;
  const stateName = stateRequirements[entity.state].name;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">{entity.name}</h3>
            <Badge variant="outline" className="bg-muted/50">
              {entity.type.toUpperCase()} - {stateName}
            </Badge>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entity.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Registered Agent Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-info mb-2">Registered Agent</h4>
            <div className="space-y-1">
              <p className="font-medium text-foreground">{entity.registered_agent_name}</p>
              {entity.registered_agent_email && (
                <p className="text-sm text-muted-foreground">{entity.registered_agent_email}</p>
              )}
              {entity.registered_agent_phone && (
                <p className="text-sm text-muted-foreground">{entity.registered_agent_phone}</p>
              )}
              {entity.registered_agent_fee && (
                <p className="text-sm font-medium text-info">${entity.registered_agent_fee}/year</p>
              )}
            </div>
          </div>

          {/* Annual Entity Fee Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-success mb-2">Annual Entity Fee</h4>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-success">${entityFee.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{stateName} state fee</p>
              <p className="text-sm text-muted-foreground">
                Due: {new Date(entity.formation_date).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};