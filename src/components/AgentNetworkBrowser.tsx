import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  CheckCircle,
  Clock,
  Send,
  Users,
  Award,
  Calendar
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface AgentNetworkBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  entityId: string;
  entityState: string;
  entityName: string;
  onConnectionRequest: (agent: any) => void;
}

// Mock agent data
const mockAgents = [
  {
    id: "1",
    name: "Sarah Johnson",
    company: "Delaware Professional Services",
    email: "sarah@delprofs.com",
    phone: "+1 (302) 555-0123",
    states: ["DE", "NJ", "PA"],
    specializations: ["LLC", "Corporation", "Non-Profit"],
    rating: 4.9,
    reviewCount: 127,
    yearsExperience: 8,
    clientCount: 340,
    averageResponseTime: "2 hours",
    serviceFee: 149,
    availability: "available",
    avatar: null,
    verified: true,
    bio: "Experienced registered agent with over 8 years serving Delaware entities. Specializing in LLC and corporate formations with same-day service guarantees."
  },
  {
    id: "2", 
    name: "Michael Chen",
    company: "First State Agent Services",
    email: "m.chen@fsagent.com",
    phone: "+1 (302) 555-0456",
    states: ["DE", "MD"],
    specializations: ["LLC", "Corporation", "Partnership"],
    rating: 4.7,
    reviewCount: 89,
    yearsExperience: 6,
    clientCount: 200,
    averageResponseTime: "4 hours",
    serviceFee: 125,
    availability: "busy",
    avatar: null,
    verified: true,
    bio: "Delaware-focused registered agent service with competitive rates and excellent customer service track record."
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    company: "Corporate Compliance Plus",
    email: "emily@corpcompplus.com", 
    phone: "+1 (302) 555-0789",
    states: ["DE", "NY", "FL"],
    specializations: ["Corporation", "Professional Corporation", "Benefit Corporation"],
    rating: 4.8,
    reviewCount: 156,
    yearsExperience: 12,
    clientCount: 500,
    averageResponseTime: "1 hour",
    serviceFee: 199,
    availability: "available",
    avatar: null,
    verified: true,
    bio: "Senior registered agent specialist with focus on complex corporate structures and compliance requirements across multiple states."
  }
];

const AgentNetworkBrowser = ({ 
  isOpen, 
  onClose, 
  onBack, 
  entityId, 
  entityState, 
  entityName,
  onConnectionRequest 
}: AgentNetworkBrowserProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [filters, setFilters] = useState({
    state: entityState,
    specialization: "all",
    rating: "all",
    availability: "all",
    priceRange: "all"
  });
  const [loading, setLoading] = useState(false);

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = filters.state === "all" || agent.states.includes(filters.state);
    const matchesSpec = filters.specialization === "all" || agent.specializations.includes(filters.specialization);
    const matchesRating = filters.rating === "all" || agent.rating >= parseFloat(filters.rating);
    const matchesAvailability = filters.availability === "all" || agent.availability === filters.availability;
    
    return matchesSearch && matchesState && matchesSpec && matchesRating && matchesAvailability;
  });

  const handleConnect = async (agent: any) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const connectionRequest = {
        id: Date.now().toString(),
        agentId: agent.id,
        agentName: agent.name,
        agentCompany: agent.company,
        agentEmail: agent.email,
        entityId,
        entityName,
        requestedAt: new Date().toISOString(),
        status: "pending",
        method: "network",
        serviceFee: agent.serviceFee
      };

      onConnectionRequest(connectionRequest);
      
      toast({
        title: "Connection Request Sent",
        description: `Request sent to ${agent.name} at ${agent.company}`
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-success';
      case 'busy': return 'text-warning';
      case 'unavailable': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getAvailabilityLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'unavailable': return 'Unavailable';
      default: return 'Unknown';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle>Browse Agent Network</DialogTitle>
              <DialogDescription>
                Discover and connect with verified registered agents in {entityState}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[70vh]">
          {/* Search & Filters */}
          <div className="space-y-4 pb-4 border-b">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="DE">Delaware</SelectItem>
                  <SelectItem value="NV">Nevada</SelectItem>
                  <SelectItem value="WY">Wyoming</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.specialization} onValueChange={(value) => setFilters(prev => ({ ...prev, specialization: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.rating} onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="4.0">4.0+ Stars</SelectItem>
                  <SelectItem value="3.5">3.5+ Stars</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priceRange} onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="0-99">$0 - $99</SelectItem>
                  <SelectItem value="100-199">$100 - $199</SelectItem>
                  <SelectItem value="200+">$200+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {filteredAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedAgent(agent)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={agent.avatar} />
                          <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{agent.name}</h3>
                            {agent.verified && (
                              <Badge variant="default" className="gap-1 text-xs">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </Badge>
                            )}
                            <Badge variant="outline" className={`gap-1 text-xs ${getAvailabilityColor(agent.availability)}`}>
                              <Clock className="h-3 w-3" />
                              {getAvailabilityLabel(agent.availability)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">{agent.company}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{agent.rating}</span>
                              <span>({agent.reviewCount} reviews)</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{agent.states.join(", ")}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{agent.clientCount} clients</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{agent.yearsExperience}+ years</span>
                            </div>
                          </div>
                          
                          <p className="text-sm mb-3">{agent.bio}</p>
                          
                          <div className="flex items-center gap-2">
                            {agent.specializations.map((spec, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-1">
                          ${agent.serviceFee}
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">per year</div>
                        <div className="text-xs text-muted-foreground mb-3">
                          Avg response: {agent.averageResponseTime}
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConnect(agent);
                          }}
                          disabled={loading || agent.availability === 'unavailable'}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Connect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredAgents.length === 0 && (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentNetworkBrowser;