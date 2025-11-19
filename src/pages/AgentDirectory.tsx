import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  Users,
  ArrowLeft,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { Agent, AgentSearchFilters } from '@/types/agent';
import { supabase } from '@/integrations/supabase/client';
import { AgentDirectoryCard } from '@/components/AgentDirectoryCard';
import InviteAgentForm from '@/components/InviteAgentForm';
import { toast } from '@/hooks/use-toast';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const AgentDirectory = () => {
  const navigate = useNavigate();
  const { agents, loading, fetchAgentsDirectory } = useAgents();
  const { user } = useAuth();
  
  const [filters, setFilters] = useState<AgentSearchFilters>({ 
    availableOnly: true 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 500]);
  const [experienceMin, setExperienceMin] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [userEntities, setUserEntities] = useState<any[]>([]);

  // Fetch user entities for invitation
  useEffect(() => {
    const fetchUserEntities = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('entities')
        .select('id, name, state, type')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setUserEntities(data);
      }
    };
    
    fetchUserEntities();
  }, [user]);

  // Fetch agents with filters
  useEffect(() => {
    const filterParams: AgentSearchFilters = {
      ...filters,
      maxPrice: priceRange[1],
      minExperience: experienceMin,
    };
    fetchAgentsDirectory(filterParams);
  }, [filters, priceRange, experienceMin]);

  // Client-side search filtering
  const filteredAgents = agents.filter(agent => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      agent.company_name?.toLowerCase().includes(search) ||
      agent.bio?.toLowerCase().includes(search) ||
      agent.contact_email?.toLowerCase().includes(search) ||
      agent.states.some(state => state.toLowerCase().includes(search))
    );
  });

  const handleInviteAgent = (agent: Agent) => {
    if (userEntities.length === 0) {
      toast({
        title: "No Entities Found",
        description: "Please create an entity before inviting agents.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAgent(agent);
    
    // Auto-select entity if there's only one
    if (userEntities.length === 1) {
      setSelectedEntityId(userEntities[0].id);
    }
    
    setShowInviteModal(true);
  };

  const handleInvitationSent = () => {
    setShowInviteModal(false);
    setSelectedAgent(null);
    setSelectedEntityId('');
    toast({
      title: "Invitation Sent",
      description: "Your invitation has been sent to the agent.",
    });
  };

  const clearFilters = () => {
    setFilters({ availableOnly: true });
    setSearchTerm('');
    setPriceRange([0, 500]);
    setExperienceMin(0);
  };

  const activeFiltersCount = 
    (filters.state ? 1 : 0) + 
    (priceRange[1] !== 500 ? 1 : 0) + 
    (experienceMin > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            Agent Directory
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse and connect with professional registered agents for your entities
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Agents</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                {agents.length}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Available Now</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-success" />
                {agents.filter(a => a.is_available).length}
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Fee</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                {agents.length > 0 
                  ? Math.round(agents.reduce((sum, a) => sum + a.price_per_entity, 0) / agents.length)
                  : 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name, location, or keywords..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* State Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      State
                    </Label>
                    <Select
                      value={filters.state || ''}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, state: value || undefined }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All States</SelectItem>
                        {US_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Max Annual Fee: ${priceRange[1]}
                    </Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      step={10}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>$500</span>
                    </div>
                  </div>

                  {/* Experience Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Min Experience: {experienceMin} years
                    </Label>
                    <Slider
                      value={[experienceMin]}
                      onValueChange={(value) => setExperienceMin(value[0])}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 years</span>
                      <span>20+ years</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredAgents.length}</span> agent{filteredAgents.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Agent Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-16 w-16 bg-secondary rounded-full mb-4" />
                  <div className="h-6 w-3/4 bg-secondary rounded" />
                  <div className="h-4 w-1/2 bg-secondary rounded mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-secondary rounded" />
                    <div className="h-4 w-5/6 bg-secondary rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Agents Found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters to see more results
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <AgentDirectoryCard
                key={agent.id}
                agent={agent}
                onInvite={handleInviteAgent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && selectedAgent && (
        <InviteAgentForm
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedAgent(null);
            setSelectedEntityId('');
          }}
          onBack={() => {
            setShowInviteModal(false);
            setSelectedAgent(null);
          }}
          entityId={selectedEntityId || userEntities[0]?.id}
          entityState={userEntities.find(e => e.id === selectedEntityId)?.state || userEntities[0]?.state}
          entityName={userEntities.find(e => e.id === selectedEntityId)?.name || userEntities[0]?.name}
          onInvitationSent={handleInvitationSent}
        />
      )}
    </div>
  );
};

export default AgentDirectory;
