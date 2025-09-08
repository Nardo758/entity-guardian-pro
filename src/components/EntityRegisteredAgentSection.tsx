import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, UserPlus, Send, Search, User, Building, Phone, Mail, CheckCircle } from "lucide-react";
import AgentAssignmentModal from "./AgentAssignmentModal";
import ManualAgentForm from "./ManualAgentForm";
import InviteAgentForm from "./InviteAgentForm";
import AgentNetworkBrowser from "./AgentNetworkBrowser";
import { toast } from "@/components/ui/use-toast";

interface EntityRegisteredAgentSectionProps {
  entityId: string;
  entityState: string;
  entityName?: string;
}

export const EntityRegisteredAgentSection = ({ entityId, entityState, entityName = "Your Entity" }: EntityRegisteredAgentSectionProps) => {
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showNetworkBrowser, setShowNetworkBrowser] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  const handleAgentMethodSelected = (result: any, method: string) => {
    setShowAssignmentModal(false);
    
    switch (method) {
      case "manual":
        setShowManualForm(true);
        break;
      case "invite":
        setShowInviteForm(true);
        break;
      case "network":
        setShowNetworkBrowser(true);
        break;
    }
  };

  const handleAgentAdded = (agent: any) => {
    setCurrentAgent(agent);
    setShowManualForm(false);
    toast({
      title: "Agent Assigned",
      description: "Registered agent has been successfully assigned to your entity"
    });
  };

  const handleInvitationSent = (invitation: any) => {
    setPendingInvitations(prev => [...prev, invitation]);
    setShowInviteForm(false);
  };

  const handleConnectionRequest = (request: any) => {
    setPendingInvitations(prev => [...prev, request]);
    setShowNetworkBrowser(false);
  };

  const closeAllModals = () => {
    setShowAssignmentModal(false);
    setShowManualForm(false);
    setShowInviteForm(false);
    setShowNetworkBrowser(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registered Agent Assignment
          </CardTitle>
          <CardDescription>
            Choose from three methods to assign a registered agent to your {entityState} entity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentAgent ? (
            // Show assigned agent
            <div className="border rounded-lg p-4 bg-success/5 border-success/20">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-success/10">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-success">Agent Assigned</h4>
                    <p className="font-medium">{currentAgent.name}</p>
                    {currentAgent.company && (
                      <p className="text-sm text-muted-foreground">{currentAgent.company}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {currentAgent.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {currentAgent.email}
                      </div>
                    </div>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          ) : pendingInvitations.length > 0 ? (
            // Show pending invitations/requests
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="border rounded-lg p-4 bg-warning/5 border-warning/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-warning">
                        {invitation.method === "invite" ? "Invitation Sent" : "Connection Request Sent"}
                      </h4>
                      <p className="text-sm">
                        {invitation.method === "invite" 
                          ? `Invited ${invitation.agentEmail}`
                          : `Requested connection with ${invitation.agentName}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invitation.sentAt || invitation.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-warning border-warning">
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show assignment options
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                No registered agent assigned. Select a method to add one:
              </p>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full gap-2">
                    <Building className="h-4 w-4" />
                    Choose Agent Assignment Method
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full" align="start">
                  <DropdownMenuItem 
                    onClick={() => setShowAssignmentModal(true)}
                    className="gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Add Agent Manually</span>
                      <span className="text-xs text-muted-foreground">Enter agent details directly</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowAssignmentModal(true)}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Invite New Agent</span>
                      <span className="text-xs text-muted-foreground">Send invitation via email</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowAssignmentModal(true)}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Browse Agent Network</span>
                      <span className="text-xs text-muted-foreground">Discover registered agents</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AgentAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        entityId={entityId}
        entityState={entityState}
        onAgentAssigned={handleAgentMethodSelected}
      />

      <ManualAgentForm
        isOpen={showManualForm}
        onClose={closeAllModals}
        onBack={() => {
          setShowManualForm(false);
          setShowAssignmentModal(true);
        }}
        entityId={entityId}
        entityState={entityState}
        onAgentAdded={handleAgentAdded}
      />

      <InviteAgentForm
        isOpen={showInviteForm}
        onClose={closeAllModals}
        onBack={() => {
          setShowInviteForm(false);
          setShowAssignmentModal(true);
        }}
        entityId={entityId}
        entityState={entityState}
        entityName={entityName}
        onInvitationSent={handleInvitationSent}
      />

      <AgentNetworkBrowser
        isOpen={showNetworkBrowser}
        onClose={closeAllModals}
        onBack={() => {
          setShowNetworkBrowser(false);
          setShowAssignmentModal(true);
        }}
        entityId={entityId}
        entityState={entityState}
        entityName={entityName}
        onConnectionRequest={handleConnectionRequest}
      />
    </>
  );
};