import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Search, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminEntityManagement, ManagedEntity } from '@/hooks/useAdminEntityManagement';
import EntityManagementModal from '@/components/admin/EntityManagementModal';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const Entities: React.FC = () => {
  const {
    entities,
    isLoading,
    refetch,
    stats,
    updateEntity,
    deleteEntity,
    isUpdating,
    isDeleting,
  } = useAdminEntityManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<ManagedEntity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Get unique states and types for filters
  const uniqueStates = useMemo(() => {
    const states = [...new Set(entities.map(e => e.state))].sort();
    return states;
  }, [entities]);

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(entities.map(e => e.type))].sort();
    return types;
  }, [entities]);

  const filteredEntities = useMemo(() => {
    return entities.filter((entity) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        entity.name.toLowerCase().includes(searchLower) ||
        entity.owner_name.toLowerCase().includes(searchLower) ||
        entity.owner_email.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === 'all' ||
        entity.status === statusFilter;

      const matchesState =
        stateFilter === 'all' ||
        entity.state === stateFilter;

      const matchesType =
        typeFilter === 'all' ||
        entity.type === typeFilter;

      return matchesSearch && matchesStatus && matchesState && matchesType;
    });
  }, [entities, searchQuery, statusFilter, stateFilter, typeFilter]);

  const handleOpenModal = (entity: ManagedEntity) => {
    setSelectedEntity(entity);
    setModalOpen(true);
  };

  const handleQuickDelete = (entity: ManagedEntity) => {
    if (window.confirm(`Are you sure you want to delete "${entity.name}"? This action cannot be undone.`)) {
      deleteEntity(entity.id);
    }
  };

  // Get top states for stats
  const topStates = useMemo(() => {
    return Object.entries(stats.byState)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [stats.byState]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entity Management</h1>
          <p className="text-muted-foreground">Manage all entities across the platform</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entity Management</h1>
          <p className="text-muted-foreground">Manage all entities across the platform</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entities</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top States</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {topStates.map(([state, count]) => (
                    <Badge key={state} variant="secondary" className="text-xs">
                      {state}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            All Entities
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            View and manage all registered entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by entity name, owner, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="dissolved">Dissolved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entities Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No entities found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{entity.name}</p>
                            {entity.formation_date && (
                              <p className="text-xs text-muted-foreground">
                                Formed: {format(new Date(entity.formation_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{entity.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {entity.state}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{entity.owner_name}</p>
                            <p className="text-xs text-muted-foreground">{entity.owner_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={entity.status === 'active' ? 'default' : 'secondary'}
                        >
                          {entity.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(entity.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(entity)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenModal(entity)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Entity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleQuickDelete(entity)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Entity
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredEntities.length} of {entities.length} entities
          </div>
        </CardContent>
      </Card>

      {/* Entity Management Modal */}
      <EntityManagementModal
        entity={selectedEntity}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={(entityId, updates) => updateEntity({ entityId, updates })}
        onDelete={deleteEntity}
        isUpdating={isUpdating || isDeleting}
      />
    </div>
  );
};

export default Entities;
