import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Mail, ExternalLink, Loader2 } from 'lucide-react';

interface AgentInvitationFlowProps {
  entityId: string;
  entityName: string;
  onClose: () => void;
}

const AgentInvitationFlow: React.FC<AgentInvitationFlowProps> = ({
  entityId,
  entityName,
  onClose
}) => {
  const [agentEmail, setAgentEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});

  const { sendInvitation } = useAgentInvitations();
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; message?: string } = {};

    if (!agentEmail.trim()) {
      newErrors.email = 'Agent email is required';
    } else if (!validateEmail(agentEmail.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (message.length > 500) {
      newErrors.message = 'Message must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Send the invitation
      await sendInvitation(entityId, agentEmail.trim(), message.trim() || undefined);
      
      // Generate invitation link (mock for now)
      const mockToken = Math.random().toString(36).substring(2, 15);
      const link = `${window.location.origin}/agent-invitation/${mockToken}`;
      setInvitationLink(link);
      
      setInvitationSent(true);
      
      toast({
        title: "Invitation Sent",
        description: `Agent invitation has been sent to ${agentEmail}`,
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: "Link Copied",
      description: "Invitation link has been copied to clipboard",
    });
  };

  if (invitationSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <CardTitle className="text-success">Invitation Sent!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              We've sent an invitation to <strong>{agentEmail}</strong> to become the registered agent for <strong>{entityName}</strong>.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Label>Share this invitation link directly:</Label>
            <div className="flex gap-2">
              <Input value={invitationLink} readOnly className="text-xs" />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={copyInvitationLink}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Invite Registered Agent</CardTitle>
        <p className="text-sm text-muted-foreground">
          Invite a registered agent for <strong>{entityName}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentEmail">Agent Email Address *</Label>
            <Input
              id="agentEmail"
              type="email"
              value={agentEmail}
              onChange={(e) => {
                setAgentEmail(e.target.value);
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              placeholder="agent@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) {
                  setErrors({ ...errors, message: undefined });
                }
              }}
              placeholder="Add a personal message to the invitation..."
              className={`min-h-[80px] ${errors.message ? 'border-destructive' : ''}`}
              maxLength={500}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              The agent will receive an email invitation with instructions to accept their role as registered agent.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AgentInvitationFlow;