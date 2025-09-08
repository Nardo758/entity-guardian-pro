import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, ArrowLeft, CheckCircle, Clock, Mail, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface InviteAgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  entityId: string;
  entityState: string;
  entityName: string;
  onInvitationSent: (invitation: any) => void;
}

const InviteAgentForm = ({ isOpen, onClose, onBack, entityId, entityState, entityName, onInvitationSent }: InviteAgentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"checking" | "exists" | "new" | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    message: `Hello! I would like to invite you to serve as the registered agent for my entity "${entityName}" in ${entityState}. Please review the details and let me know if you're available for this service.`,
    serviceFee: "150",
    urgency: "standard"
  });

  const handleEmailCheck = async (email: string) => {
    if (!email || !email.includes("@")) return;
    
    setEmailStatus("checking");
    
    // Simulate API call to check if email exists on platform
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Random simulation - in real app would check actual database
    const exists = Math.random() > 0.7;
    setEmailStatus(exists ? "exists" : "new");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const invitation = {
        id: Date.now().toString(),
        entityId,
        entityName,
        agentEmail: formData.email,
        message: formData.message,
        serviceFee: parseFloat(formData.serviceFee) || 0,
        status: "sent",
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        method: "invite",
        urgency: formData.urgency,
        isNewUser: emailStatus === "new"
      };

      onInvitationSent(invitation);
      
      toast({
        title: "Invitation Sent",
        description: `Agent invitation sent to ${formData.email}`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle>Invite Agent via Email</DialogTitle>
              <DialogDescription>
                Send an invitation to an agent to serve your entity in {entityState}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email & Status */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Contact</CardTitle>
              <CardDescription>Enter the agent's email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    setEmailStatus(null);
                  }}
                  onBlur={() => handleEmailCheck(formData.email)}
                  placeholder="agent@example.com"
                  required
                />
                
                {emailStatus && (
                  <div className="mt-2">
                    {emailStatus === "checking" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 animate-spin" />
                        Checking if agent is on platform...
                      </div>
                    )}
                    {emailStatus === "exists" && (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Platform User
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Agent will receive an in-app notification
                        </span>
                      </div>
                    )}
                    {emailStatus === "new" && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Mail className="h-3 w-3" />
                          New User
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Invitation will include signup instructions
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Specify service requirements and fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceFee">Proposed Annual Fee ($)</Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    value={formData.serviceFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceFee: e.target.value }))}
                    placeholder="150"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="urgency">Response Needed</Label>
                  <select
                    id="urgency"
                    value={formData.urgency}
                    onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="standard">Standard (7 days)</option>
                    <option value="priority">Priority (3 days)</option>
                    <option value="urgent">Urgent (24 hours)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Message */}
          <Card>
            <CardHeader>
              <CardTitle>Invitation Message</CardTitle>
              <CardDescription>Personalize your invitation (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your custom message to the agent..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm">Invitation Preview</CardTitle>
            </CardHeader>
            <CardContent className="bg-muted/30 rounded-md p-4">
              <div className="text-sm space-y-2">
                <div className="font-medium">Subject: Registered Agent Service Invitation - {entityName}</div>
                <div className="text-muted-foreground">To: {formData.email || "agent@example.com"}</div>
                <Separator className="my-2" />
                <div className="whitespace-pre-wrap">{formData.message}</div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  Invitation expires in 30 days
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.email} className="min-w-[140px]">
              {loading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteAgentForm;