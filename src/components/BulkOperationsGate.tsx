import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Edit, Trash2, Download, Upload, Lock, Crown } from 'lucide-react';
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { useUpgradePrompt } from '@/components/UpgradePrompt';

interface BulkOperationsGateProps {
  selectedEntities: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAction: (action: string) => void;
  totalEntities: number;
}

export const BulkOperationsGate: React.FC<BulkOperationsGateProps> = ({
  selectedEntities,
  onSelectAll,
  onDeselectAll,
  onBulkAction,
  totalEntities
}) => {
  const permissions = useTierPermissions();
  const { showUpgradePrompt, UpgradePromptComponent } = useUpgradePrompt();

  const handleRestrictedAction = (actionName: string) => {
    showUpgradePrompt(
      'Bulk Operations',
      'growth',
      `Perform bulk ${actionName.toLowerCase()} operations with the Growth plan.`
    );
  };

  const bulkActions = [
    { 
      key: 'edit', 
      label: 'Bulk Edit', 
      icon: Edit, 
      description: 'Edit multiple entities at once' 
    },
    { 
      key: 'export', 
      label: 'Export Selected', 
      icon: Download, 
      description: 'Export entity data' 
    },
    { 
      key: 'import', 
      label: 'Import Entities', 
      icon: Upload, 
      description: 'Import entities from file' 
    },
    { 
      key: 'delete', 
      label: 'Bulk Delete', 
      icon: Trash2, 
      description: 'Delete multiple entities', 
      destructive: true 
    },
  ];

  if (!permissions.canBulkOperations) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Bulk Operations</span>
              <Badge variant="outline" className="gap-1">
                <Crown className="h-3 w-3" />
                Growth Required
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage multiple entities efficiently with bulk operations
            </p>
          </div>
        </div>
        <Button 
          onClick={() => handleRestrictedAction('Operations')}
          className="gap-2"
        >
          <Crown className="h-4 w-4" />
          Upgrade to Growth
        </Button>
        <UpgradePromptComponent />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedEntities.length === totalEntities && totalEntities > 0}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectAll();
              } else {
                onDeselectAll();
              }
            }}
          />
          <span className="text-sm font-medium">
            {selectedEntities.length > 0 
              ? `${selectedEntities.length} selected`
              : `Select entities (${totalEntities} total)`
            }
          </span>
        </div>
      </div>

      {selectedEntities.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedEntities.length} entity{selectedEntities.length !== 1 ? 'ies' : 'y'} selected
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Bulk Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.key}
                    onClick={() => onBulkAction(action.key)}
                    className={`gap-2 ${action.destructive ? 'text-destructive' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{action.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};