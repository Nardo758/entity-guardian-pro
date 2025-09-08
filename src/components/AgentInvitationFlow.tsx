import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, DollarSign, Calendar, Send, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAgentInvitations } from '@/hooks/useAgentInvitations';

interface AgentInvitationFlowProps {
  entityId: string;
  entityName: string;
  onClose: () => void;
  onSuccess: (invitation: any) => void;
}

interface InvitationData {
  agentEmail: string;
  serviceFee: string;
  message: string;
  dueDate: string;
}

const AgentInvitationFlow: React.FC<AgentInvitationFlowProps> = ({
  entityId,
  entityName,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const { sendInvitation } = useAgentInvitations();
  const [step, setStep] = useState<'compose' | 'review' | 'sending'>('compose');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InvitationData>({
    agentEmail: '',
    serviceFee: '',
    message: '',
    dueDate: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.agentEmail.trim()) {
      toast({ title: "Error", description: "Agent email is required", variant: "destructive" });
      return false;
    }

    if (!validateEmail(formData.agentEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return false;
    }

    if (!formData.serviceFee || parseFloat(formData.serviceFee) <= 0) {
      toast({ title: "Error", description: "Service fee must be greater than 0", variant: "destructive" });
      return false;
    }

    if (!formData.dueDate) {
      toast({ title: "Error", description: "Due date is required", variant: "destructive" });
      return false;
    }

    const selectedDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      toast({ title: "Error", description: "Due date must be in the future", variant: "destructive" });
      return false;
    }

    return true;
  };

  const handleInputChange = (field: keyof InvitationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep('review');
    }
  };

  const handleSendInvitation = async () => {
    setLoading(true);
    setStep('sending');

    try {
      const invitation = await sendInvitation(
        entityId,
        formData.agentEmail,
        formData.message
      );

      toast({
        title: "Invitation Sent Successfully",
        description: `Invitation sent to ${formData.agentEmail}`,
      });

      onSuccess(invitation);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Failed to Send Invitation",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'compose') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Invite Registered Agent
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Send an invitation to a registered agent for {entityName}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agentEmail">Agent Email Address *</Label>
            <Input
              id="agentEmail"
              type="email"
              placeholder="agent@example.com"
              value={formData.agentEmail}
              onChange={(e) => handleInputChange('agentEmail', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceFee">Annual Service Fee ($) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="serviceFee"
                type="number"
                min="0"
                step="0.01"
                placeholder="199.00"
                value={formData.serviceFee}
                onChange={(e) => handleInputChange('serviceFee', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Service Start Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any special instructions or requirements..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleNext}>
              Review Invitation
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'review') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Review Invitation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Please review the invitation details before sending
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Entity:</span>
              <Badge variant="secondary">{entityName}</Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between">
              <span className="font-medium">Agent Email:</span>
              <span>{formData.agentEmail}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Annual Service Fee:</span>
              <span className="font-semibold text-primary">${parseFloat(formData.serviceFee).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Service Start Date:</span>
              <span>{new Date(formData.dueDate).toLocaleDateString()}</span>
            </div>

            {formData.message && (
              <>
                <Separator />
                <div>
                  <span className="font-medium">Custom Message:</span>
                  <p className="text-sm text-muted-foreground mt-1">{formData.message}</p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep('compose')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Edit
            </Button>
            <Button onClick={handleSendInvitation} disabled={loading}>
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sending state
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-8 pb-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Sending Invitation</h3>
            <p className="text-muted-foreground">
              Preparing invitation for {formData.agentEmail}...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentInvitationFlow;