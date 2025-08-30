import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MapPin, DollarSign, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import { Agent, AgentSearchFilters } from '@/types/agent';
import { supabase } from '@/integrations/supabase/client';
import AgentInviteModal from '@/components/AgentInviteModal';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const AgentDirectory = () => {
  const { agents, loading, fetchAgents } = useAgents();
  const { user } = useAuth();
  const [filters, setFilters] = useState<AgentSearchFilters>({ availableOnly: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [userEntities, setUserEntities] = useState([]);

  // Fetch user entities for invitation modal
  useEffect(() => {
    const fetchUserEntities = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('entities')
        .select('id, name, state, type')
        .eq('user_id', user.id);
      
      setUserEntities(data || []);
    };
    
    fetchUserEntities();
  }, [user]);

  useEffect(() => {
    fetchAgents(filters);
  }, [filters]);

  const filteredAgents = agents.filter(agent => {
    if (!searchTerm) return true;
    return (
      agent.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.states.some(state => state.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleInviteAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowInviteModal(true);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Registered Agents</h1>
        <p className="text-muted-foreground">
          Browse our directory of professional registered agents to serve your business entities.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by company, location, or expertise..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Select
            value={filters.state || ''}
            onValueChange={(value) => 
              setFilters(prev => ({ ...prev, state: value || undefined }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All States</SelectItem>
              {US_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.maxPrice?.toString() || ''}
            onValueChange={(value) => 
              setFilters(prev => ({ ...prev, maxPrice: value ? parseInt(value) : undefined }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Max Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Price</SelectItem>
              <SelectItem value="199">Under $199</SelectItem>
              <SelectItem value="299">Under $299</SelectItem>
              <SelectItem value="399">Under $399</SelectItem>
              <SelectItem value="499">Under $499</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setFilters({ availableOnly: true })}
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">
                    {agent.company_name || 'Professional Agent'}
                  </span>
                  {agent.is_available && (
                    <Badge variant="secondary">Available</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${agent.price_per_entity}/entity
                  </div>
                  {agent.years_experience && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {agent.years_experience} years
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="text-sm font-medium">Licensed States:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.states.map(state => (
                      <Badge key={state} variant="outline" className="text-xs">
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>

                {agent.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {agent.bio}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleInviteAgent(agent)}
                  >
                    Invite Agent
                  </Button>
                  {agent.contact_email && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`mailto:${agent.contact_email}`, '_blank')}
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or browse all available agents.
            </p>
            <Button onClick={() => setFilters({ availableOnly: true })}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDirectory;