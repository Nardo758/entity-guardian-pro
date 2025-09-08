import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { Entity } from '@/types/entity';
import { Mail, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EntityInviteAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity;
}

const EntityInviteAgentModal: React.FC<EntityInviteAgentModalProps> = ({ 
  isOpen, 
  onClose, 
  entity 
}) => {
  const { sendInvitation } = useAgentInvitations();
  const [agentEmail, setAgentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [invitationLink, setInvitationLink] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSendInvitation = async () => {
    if (!agentEmail.trim()) {
      toast.error('Please enter agent email address');
      return;
    }

    setLoading(true);
    try {
      const invitation = await sendInvitation(entity.id, agentEmail, message);
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
    setAgentEmail('');
    setMessage('');
    setInvitationLink('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Registered Agent for {entity.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entity Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">{entity.name}</h4>
            <p className="text-sm text-muted-foreground">
              {entity.type.toUpperCase()} • {entity.state} • Formed: {entity.formation_date}
            </p>
          </div>

          {!invitationLink ? (
            <>
              {/* Agent Email */}
              <div>
                <Label htmlFor="agent-email">Agent Email Address</Label>
                <Input
                  id="agent-email"
                  type="email"
                  placeholder="agent@example.com"
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  className="mt-1"
                />
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
                  disabled={!agentEmail.trim() || loading}
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
                    onClick={() => window.open(`mailto:${agentEmail}?subject=Registered Agent Invitation for ${entity.name}&body=Please click this link to review our registered agent request: ${invitationLink}`, '_blank')}
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

export default EntityInviteAgentModal;