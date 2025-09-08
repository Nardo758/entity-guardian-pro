import React, { useState } from 'react';
import { Building, Plus, MoreVertical, Trash2, Eye, CheckSquare, Square, Archive, AlertTriangle, Calendar, Tag as TagIcon, Star, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Entity, EntityFilters, BulkOperation } from '@/types/entity';
import { stateRequirements } from '@/lib/state-requirements';
import { useNavigate } from 'react-router-dom';
import { EntityFilters as EntityFiltersComponent } from '@/components/EntityFilters';
import { BulkOperations } from '@/components/BulkOperations';

interface EnhancedEntityPortfolioProps {
  entities: Entity[];
  filters: EntityFilters;
  onFiltersChange: (filters: EntityFilters) => void;
  onAddEntity: () => void;
  onDeleteEntity: (id: string) => void;
  onUpdateEntity: (id: string, updates: Partial<Entity>) => void;
  onBulkOperation: (operation: BulkOperation) => void;
}

const EntityCard: React.FC<{
  entity: Entity;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Entity>) => void;
}> = ({ entity, isSelected, onSelect, onDelete, onUpdate }) => {
  const navigate = useNavigate();
  const entityFee = stateRequirements[entity.state]?.[entity.type]?.fee || 0;
  const totalAnnualFees = entityFee + (entity.registered_agent_fee || 0) + (entity.independent_director_fee || 0);

  const getEntityTypeColor = (type: string) => {
    const colors = {
      'llc': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'c_corp': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      's_corp': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'partnership': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'sole_proprietorship': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.llc;
  };

  const getStatusColor = (status?: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'inactive': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'archived': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const getComplianceColor = (status?: string) => {
    const colors = {
      'compliant': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'unknown': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || colors.compliant;
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

  const getPriorityStars = (priority?: number) => {
    const p = priority || 3;
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < p ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur-sm border-border/50 ${
      isSelected ? 'ring-2 ring-primary border-primary' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {entity.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={`text-xs font-medium ${getEntityTypeColor(entity.type)}`}>
                  {formatEntityType(entity.type)}
                </Badge>
                <span className="text-sm text-muted-foreground">{entity.state}</span>
                <Badge className={`text-xs ${getStatusColor(entity.status)}`}>
                  {entity.status || 'active'}
                </Badge>
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
              <DropdownMenuItem onClick={() => onUpdate(entity.id, { status: 'archived' })}>
                <Archive className="h-4 w-4 mr-2" />
                Archive Entity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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

        {/* Priority and Compliance Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {getPriorityStars(entity.priority)}
          </div>
          <Badge className={`text-xs ${getComplianceColor(entity.compliance_status)}`}>
            {entity.compliance_status || 'compliant'}
          </Badge>
        </div>

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {entity.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <TagIcon className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {entity.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{entity.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Financial Information */}
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

          {entity.independent_director_fee && entity.independent_director_fee > 0 && (
            <div className="flex items-center justify-between py-2 px-3 bg-info/5 rounded-lg border border-info/10">
              <span className="text-sm text-muted-foreground">Independent Director</span>
              <span className="font-semibold text-info">${entity.independent_director_fee.toFixed(2)}/year</span>
            </div>
          )}

          {/* Important Dates */}
          {(entity.next_filing_date || entity.annual_report_due_date) && (
            <div className="pt-2 border-t border-border/50">
              {entity.next_filing_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Next Filing
                  </span>
                  <span className="text-foreground">{new Date(entity.next_filing_date).toLocaleDateString()}</span>
                </div>
              )}
              {entity.annual_report_due_date && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground flex items-center">
                    <FileText className="w-3 h-3 mr-1" />
                    Annual Report Due
                  </span>
                  <span className="text-foreground">{new Date(entity.annual_report_due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Total Annual Cost</span>
              <span className="text-lg font-bold text-foreground">${totalAnnualFees.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState: React.FC<{ onAddEntity: () => void; hasFilters: boolean }> = ({ onAddEntity, hasFilters }) => (
  <Card className="border-2 border-dashed border-border/50 bg-muted/10">
    <CardContent className="flex flex-col items-center justify-center py-16 px-6">
      <div className="p-4 bg-muted/20 rounded-full mb-4">
        <Building className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasFilters ? 'No entities match your filters' : 'No entities in your portfolio'}
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
        {hasFilters 
          ? 'Try adjusting your filters or add a new entity to get started.'
          : 'Start building your business portfolio by adding your first entity. Track renewals, manage compliance, and stay organized.'
        }
      </p>
      <Button onClick={onAddEntity} size="lg" className="font-medium">
        <Plus className="mr-2 h-4 w-4" />
        Add {hasFilters ? 'New' : 'Your First'} Entity
      </Button>
    </CardContent>
  </Card>
);

export const EnhancedEntityPortfolio: React.FC<EnhancedEntityPortfolioProps> = ({
  entities,
  filters,
  onFiltersChange,
  onAddEntity,
  onDeleteEntity,
  onUpdateEntity,
  onBulkOperation
}) => {
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedEntities.length === entities.length) {
      setSelectedEntities([]);
    } else {
      setSelectedEntities(entities.map(e => e.id));
    }
  };

  const handleSelectEntity = (entityId: string, selected: boolean) => {
    if (selected) {
      setSelectedEntities(prev => [...prev, entityId]);
    } else {
      setSelectedEntities(prev => prev.filter(id => id !== entityId));
    }
  };

  const clearSelection = () => {
    setSelectedEntities([]);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== '');
    }
    return value !== undefined && value !== '';
  });

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              Entity Portfolio
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {entities.length} {entities.length === 1 ? 'entity' : 'entities'} in your business portfolio
            </p>
          </div>
          <div className="flex items-center gap-2">
            {entities.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  {selectedEntities.length === entities.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Separator orientation="vertical" className="h-4" />
              </div>
            )}
            <Button onClick={onAddEntity} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Entity
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <EntityFiltersComponent
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={clearFilters}
        />

        {/* Bulk Operations */}
        <BulkOperations
          selectedEntities={selectedEntities}
          onClearSelection={clearSelection}
          onBulkOperation={onBulkOperation}
          totalEntities={entities.length}
        />

        {/* Entity Grid */}
        {entities.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {entities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                isSelected={selectedEntities.includes(entity.id)}
                onSelect={(selected) => handleSelectEntity(entity.id, selected)}
                onDelete={onDeleteEntity}
                onUpdate={onUpdateEntity}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAddEntity={onAddEntity} hasFilters={hasFilters} />
        )}
      </CardContent>
    </Card>
  );
};