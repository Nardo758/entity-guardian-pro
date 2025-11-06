import React, { memo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Building2, Calendar, DollarSign, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Entity } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';

interface SimpleEntityCardProps {
  entity: Entity;
  onDelete?: (id: string) => void;
}

export const SimpleEntityCard = memo<SimpleEntityCardProps>(({ entity, onDelete }) => {
  const entityFee = stateRequirements[entity.state]?.[entity.type]?.fee || 0;
  const stateName = stateRequirements[entity.state]?.name || entity.state;

  return (
    <Card className="border-border/50 hover:border-border hover:shadow-xl transition-all duration-200 bg-card/60 backdrop-blur-sm group">
      <CardHeader className="pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl group-hover:from-primary/15 group-hover:to-primary/10 transition-colors">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {entity.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-medium">
                  {entity.type.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="text-sm font-medium">{stateName}</span>
                </div>
              </div>
            </div>
          </div>
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entity.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Registered Agent Section */}
          <div className="bg-gradient-to-br from-info/5 to-transparent rounded-2xl p-5 border border-info/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-info/10 rounded-xl">
                <Users className="h-4 w-4 text-info" />
              </div>
              <h4 className="font-semibold text-foreground">Registered Agent</h4>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">{entity.registered_agent_name}</p>
              {entity.registered_agent_email && (
                <p className="text-sm text-muted-foreground">{entity.registered_agent_email}</p>
              )}
              {entity.registered_agent_phone && (
                <p className="text-sm text-muted-foreground">{entity.registered_agent_phone}</p>
              )}
              {entity.registered_agent_fee && (
                <div className="pt-2">
                  <p className="text-lg font-bold text-info">${entity.registered_agent_fee}</p>
                  <p className="text-xs text-muted-foreground font-medium">per year</p>
                </div>
              )}
            </div>
          </div>

          {/* Annual Entity Fee Section */}
          <div className="bg-gradient-to-br from-success/5 to-transparent rounded-2xl p-5 border border-success/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-success/10 rounded-xl">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <h4 className="font-semibold text-foreground">State Fee</h4>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-success">${entityFee.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground font-medium">{stateName} annual fee</p>
            </div>
          </div>

          {/* Formation Date Section */}
          <div className="bg-gradient-to-br from-secondary/5 to-transparent rounded-2xl p-5 border border-border/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-secondary rounded-xl">
                <Calendar className="h-4 w-4 text-foreground" />
              </div>
              <h4 className="font-semibold text-foreground">Formation</h4>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">
                {new Date(entity.formation_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Formation date</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SimpleEntityCard.displayName = 'SimpleEntityCard';