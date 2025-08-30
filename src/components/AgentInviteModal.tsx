import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { Agent } from '@/types/agent';
import { Entity } from '@/types/entity';
import { Mail, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AgentInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent;
  entities: Entity[];
}

const AgentInviteModal: React.FC<AgentInviteModalProps> = ({ 
  isOpen, 
  onClose, 
  agent, 
  entities 
}) => {
  const { sendInvitation } = useAgentInvitations();
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [invitationLink, setInvitationLink] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSendInvitation = async () => {
    if (!selectedEntityId || !agent?.contact_email) {
      toast.error('Please select an entity and ensure agent has contact email');
      return;
    }

    setLoading(true);
    try {
      const invitation = await sendInvitation(selectedEntityId, agent.contact_email, message);
      if (invitation) {
        const link = `${window.location.origin}/agent-invitation/${invitation.token}`;
        setInvitationLink(link);
        toast.success('Invitation link generated! You can copy and send it to the agent.');
      }
    } catch (error) {
      toast.error('Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast.success('Invitation link copied to clipboard!');
  };

  const resetModal = () => {
    setSelectedEntityId('');
    setMessage('');
    setInvitationLink('');
    onClose();
  };

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Registered Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">{agent.company_name}</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {agent.states.map(state => (
                <Badge key={state} variant="outline" className="text-xs">
                  {state}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              ${agent.price_per_entity}/year per entity
            </p>
          </div>

          {!invitationLink ? (
            <>
              {/* Entity Selection */}
              <div>
                <Label htmlFor="entity-select">Select Entity</Label>
                <select
                  id="entity-select"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                >
                  <option value="">Choose an entity...</option>
                  {entities.map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name} ({entity.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Optional Message</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message for the registered agent..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSendInvitation}
                  disabled={!selectedEntityId || loading}
                  className="flex-1"
                >
                  {loading ? 'Creating Invitation...' : 'Generate Invitation Link'}
                </Button>
                <Button variant="outline" onClick={resetModal}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h4 className="font-semibold text-lg">Invitation Link Generated!</h4>
                <p className="text-muted-foreground">
                  Copy the link below and send it to the registered agent via your preferred method.
                </p>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Input 
                      value={invitationLink} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button 
                      size="sm"
                      onClick={copyInvitationLink}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`mailto:${agent.contact_email}?subject=Registered Agent Invitation&body=Please click this link to review our registered agent request: ${invitationLink}`, '_blank')}
                    className="flex-1"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email
                  </Button>
                  <Button variant="outline" onClick={resetModal} className="flex-1">
                    Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentInviteModal;