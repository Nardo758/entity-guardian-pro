import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { BulkOperationsGate } from '@/components/BulkOperationsGate';
import { EntityLimitWarning } from '@/components/EntityLimitWarning';
import { TierBadge } from '@/components/TierBadge';
import { ArrowLeft, Plus, Search, Filter, Building, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useEntities } from '@/hooks/useEntities';
import { EntityForm } from '@/components/EntityForm';
import EntityInviteAgentModal from '@/components/EntityInviteAgentModal';
import AddAgentModal from '@/components/AddAgentModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Entities: React.FC = () => {
  const navigate = useNavigate();
  const permissions = useTierPermissions();
  const { entities, loading, deleteEntity } = useEntities();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === "all" || entity.state === stateFilter;
    const matchesType = typeFilter === "all" || entity.type === typeFilter;
    
    return matchesSearch && matchesState && matchesType;
  });

  const uniqueStates = Array.from(new Set(entities.map(e => e.state))).sort();
  const uniqueTypes = Array.from(new Set(entities.map(e => e.type))).sort();

  const handleInviteAgent = (entity: any) => {
    setSelectedEntity(entity);
    setShowInviteModal(true);
  };

  const handleAddAgent = (entity: any) => {
    setSelectedEntity(entity);
    setShowAddAgentModal(true);
  };

  const handleDeleteEntity = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entity?')) {
      await deleteEntity(id);
    }
  };

  const handleSelectAll = () => {
    setSelectedEntities(filteredEntities.map(e => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedEntities([]);
  };

  const handleBulkAction = async (action: string) => {
    switch (action) {
      case 'edit':
        console.log('Bulk edit entities:', selectedEntities);
        break;
      case 'export':
        console.log('Export entities:', selectedEntities);
        break;
      case 'import':
        console.log('Import entities');
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedEntities.length} entities?`)) {
          console.log('Bulk delete entities:', selectedEntities);
          setSelectedEntities([]);
        }
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold">Entity Management</h1>
                <TierBadge />
              </div>
              <p className="text-muted-foreground">Manage your business entities and agent assignments</p>
            </div>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entity
          </Button>
        </div>

        {/* Entity Limits Warning */}
        <EntityLimitWarning />

        {/* Bulk Operations */}
        <BulkOperationsGate
          selectedEntities={selectedEntities}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkAction={handleBulkAction}
          totalEntities={filteredEntities.length}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entities.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delaware Entities</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entities.filter(e => e.state === 'DE').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LLCs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entities.filter(e => e.type === 'llc').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entities.filter(e => e.registered_agent_name).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStateFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntities.map((entity) => (
            <Card key={entity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{entity.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4" />
                        Manage Agent
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleAddAgent(entity)}>
                        Add Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleInviteAgent(entity)}>
                        Invite Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  {entity.type.replace('_', ' ').toUpperCase()} • {entity.state}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Formation Date:</span>
                    <span>{new Date(entity.formation_date).toLocaleDateString()}</span>
                  </div>
                  {entity.registered_agent_name && (
                    <div className="flex justify-between text-sm">
                      <span>Agent:</span>
                      <span className="font-medium">{entity.registered_agent_name}</span>
                    </div>
                  )}
                  {entity.registered_agent_fee && (
                    <div className="flex justify-between text-sm">
                      <span>Agent Fee:</span>
                      <span className="font-medium">${entity.registered_agent_fee}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge variant={entity.registered_agent_name ? "default" : "secondary"}>
                    {entity.registered_agent_name ? "Agent Assigned" : "No Agent"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/entity/${entity.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteEntity(entity.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEntities.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No entities found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || stateFilter !== "all" || typeFilter !== "all" 
                  ? "Try adjusting your filters to see more results."
                  : "Get started by adding your first business entity."}
              </p>
              {!searchTerm && stateFilter === "all" && typeFilter === "all" && (
                <Button onClick={() => setShowAddForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Entity
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showAddForm && (
        <EntityForm 
          onClose={() => setShowAddForm(false)}
          onSubmit={async (entityData) => {
            // This will be handled by the EntityForm's internal logic
            setShowAddForm(false);
          }}
        />
      )}

      {showInviteModal && selectedEntity && (
        <EntityInviteAgentModal
          entity={selectedEntity}
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedEntity(null);
          }}
        />
      )}

      {showAddAgentModal && selectedEntity && (
        <AddAgentModal
          entity={selectedEntity}
          isOpen={showAddAgentModal}
          onClose={() => {
            setShowAddAgentModal(false);
            setSelectedEntity(null);
          }}
        />
      )}
    </div>
  );
};

export default Entities;