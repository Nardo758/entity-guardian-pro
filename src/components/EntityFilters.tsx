import React, { useState } from 'react';
import { Filter, X, Search, Calendar, Tag, Building, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EntityFilters as EntityFiltersType } from '@/types/entity';

interface EntityFiltersProps {
  filters: EntityFiltersType;
  onFiltersChange: (filters: EntityFiltersType) => void;
  onClearFilters: () => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const ENTITY_TYPES = [
  { value: 'llc', label: 'LLC' },
  { value: 'c_corp', label: 'C-Corp' },
  { value: 's_corp', label: 'S-Corp' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' }
];

const STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'archived', label: 'Archived', color: 'bg-red-100 text-red-800' }
];

const COMPLIANCE_STATUSES = [
  { value: 'compliant', label: 'Compliant', color: 'bg-green-100 text-green-800' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  { value: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-800' }
];

export const EntityFilters: React.FC<EntityFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== '');
    }
    return value !== undefined && value !== '';
  });

  const updateFilter = (key: keyof EntityFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: keyof EntityFiltersType, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray.length > 0 ? newArray : undefined);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.states?.length) count++;
    if (filters.types?.length) count++;
    if (filters.statuses?.length) count++;
    if (filters.complianceStatuses?.length) count++;
    if (filters.priorities?.length) count++;
    if (filters.tags?.length) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    return count;
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search entities..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          className="pl-10"
        />
      </div>

      {/* Advanced Filters */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Advanced Filters</h3>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearFilters}
                  className="text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {/* States Filter */}
              <div>
                <Label className="text-sm font-medium flex items-center mb-2">
                  <Building className="w-4 h-4 mr-1" />
                  States
                </Label>
                <div className="max-h-32 overflow-y-auto border rounded p-2">
                  <div className="grid grid-cols-3 gap-2">
                    {US_STATES.map((state) => (
                      <div key={state} className="flex items-center space-x-2">
                        <Checkbox
                          id={`state-${state}`}
                          checked={filters.states?.includes(state) || false}
                          onCheckedChange={() => toggleArrayFilter('states', state)}
                        />
                        <Label htmlFor={`state-${state}`} className="text-xs cursor-pointer">
                          {state}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Entity Types */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Entity Types</Label>
                <div className="space-y-2">
                  {ENTITY_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={filters.types?.includes(type.value as any) || false}
                        onCheckedChange={() => toggleArrayFilter('types', type.value)}
                      />
                      <Label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Status</Label>
                <div className="space-y-2">
                  {STATUSES.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.statuses?.includes(status.value as any) || false}
                        onCheckedChange={() => toggleArrayFilter('statuses', status.value)}
                      />
                      <Label htmlFor={`status-${status.value}`} className="text-sm cursor-pointer flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${status.color}`}></span>
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Compliance Status */}
              <div>
                <Label className="text-sm font-medium flex items-center mb-2">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Compliance Status
                </Label>
                <div className="space-y-2">
                  {COMPLIANCE_STATUSES.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`compliance-${status.value}`}
                        checked={filters.complianceStatuses?.includes(status.value as any) || false}
                        onCheckedChange={() => toggleArrayFilter('complianceStatuses', status.value)}
                      />
                      <Label htmlFor={`compliance-${status.value}`} className="text-sm cursor-pointer flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${status.color}`}></span>
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Priority Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Priority</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <Button
                      key={priority}
                      variant={filters.priorities?.includes(priority) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleArrayFilter('priorities', priority.toString())}
                      className="w-8 h-8 p-0"
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 ml-2">
          {filters.search && (
            <Badge variant="secondary" className="text-xs">
              Search: {filters.search}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('search', undefined)}
              />
            </Badge>
          )}
          {filters.states?.map(state => (
            <Badge key={state} variant="secondary" className="text-xs">
              {state}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => toggleArrayFilter('states', state)}
              />
            </Badge>
          ))}
          {filters.statuses?.map(status => (
            <Badge key={status} variant="secondary" className="text-xs">
              {status}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => toggleArrayFilter('statuses', status)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};