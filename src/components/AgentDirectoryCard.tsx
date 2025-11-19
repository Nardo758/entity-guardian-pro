import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Mail, 
  Send,
  CheckCircle,
  Clock
} from "lucide-react";
import { Agent } from "@/types/agent";

interface AgentDirectoryCardProps {
  agent: Agent;
  onInvite: (agent: Agent) => void;
}

export const AgentDirectoryCard = ({ agent, onInvite }: AgentDirectoryCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getInitials = (companyName: string) => {
    return companyName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-lg">
                {getInitials(agent.company_name || 'RA')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">{agent.company_name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {agent.is_available ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-success font-medium">Available</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Currently Unavailable</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio */}
          {agent.bio && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {agent.bio}
            </p>
          )}

          {/* Key Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Serves:</span>
              <div className="flex flex-wrap gap-1">
                {agent.states.slice(0, 5).map((state) => (
                  <Badge key={state} variant="secondary" className="text-xs">
                    {state}
                  </Badge>
                ))}
                {agent.states.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{agent.states.length - 5} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">Annual Fee:</span>
              <span className="text-foreground font-semibold">
                ${agent.price_per_entity.toFixed(2)}
              </span>
              <span className="text-muted-foreground">per entity</span>
            </div>

            {agent.years_experience > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Experience:</span>
                <span className="text-foreground">
                  {agent.years_experience} year{agent.years_experience !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {agent.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-foreground">{agent.contact_email}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowDetails(true)}
          >
            View Details
          </Button>
          <Button 
            className="flex-1"
            onClick={() => onInvite(agent)}
            disabled={!agent.is_available}
          >
            <Send className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </CardFooter>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-2xl">
                  {getInitials(agent.company_name || 'RA')}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">{agent.company_name}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  {agent.is_available ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-success font-medium">Available for New Clients</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Currently Unavailable</span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Bio */}
            {agent.bio && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  About
                </h3>
                <p className="text-muted-foreground">{agent.bio}</p>
              </div>
            )}

            {/* Service States */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Service States ({agent.states.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {agent.states.map((state) => (
                  <Badge key={state} variant="secondary">
                    {state}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pricing & Experience */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Annual Fee</span>
                </div>
                <p className="text-2xl font-bold">
                  ${agent.price_per_entity.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">per entity/year</p>
              </div>

              {agent.years_experience > 0 && (
                <div className="p-4 bg-secondary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Experience</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {agent.years_experience}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    year{agent.years_experience !== 1 ? 's' : ''} of service
                  </p>
                </div>
              )}
            </div>

            {/* Contact */}
            {agent.contact_email && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <p className="text-muted-foreground">{agent.contact_email}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
              <Button 
                className="flex-1"
                onClick={() => {
                  setShowDetails(false);
                  onInvite(agent);
                }}
                disabled={!agent.is_available}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
