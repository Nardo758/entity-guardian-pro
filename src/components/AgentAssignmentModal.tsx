import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Send, Search, Star, MapPin, Phone, Mail, Building, CheckCircle } from "lucide-react";

interface AgentAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityState: string;
  onAgentAssigned: (agent: any, method: string) => void;
}

const AgentAssignmentModal = ({ isOpen, onClose, entityId, entityState, onAgentAssigned }: AgentAssignmentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const methods = [
    {
      id: "manual",
      title: "Add Agent Manually",
      description: "Enter agent details directly for immediate assignment",
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      benefits: ["Immediate activation", "Known agent relationships", "Direct control"]
    },
    {
      id: "invite",
      title: "Invite New Agent", 
      description: "Send invitation to agent via email",
      icon: Send,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      benefits: ["Email verification", "Platform onboarding", "Viral growth"]
    },
    {
      id: "network",
      title: "Browse Agent Network",
      description: "Discover and connect with registered agents",
      icon: Search,
      color: "text-purple-600",
      bgColor: "bg-purple-50", 
      borderColor: "border-purple-200",
      benefits: ["Verified agents", "Reviews & ratings", "Specialization matching"]
    }
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleContinue = () => {
    if (selectedMethod) {
      onAgentAssigned({ method: selectedMethod }, selectedMethod);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose Agent Assignment Method</DialogTitle>
          <DialogDescription>
            Select how you'd like to add a registered agent to your entity: {entityState}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {methods.map((method) => {
            const IconComponent = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <Card
                key={method.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? `${method.borderColor} ring-2 ring-offset-2` 
                    : 'hover:border-primary/20'
                }`}
                onClick={() => handleMethodSelect(method.id)}
              >
                <CardHeader className="text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full ${method.bgColor} flex items-center justify-center mb-3`}>
                    <IconComponent className={`h-6 w-6 ${method.color}`} />
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {method.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  {isSelected && (
                    <Badge className="w-full justify-center mt-3" variant="default">
                      Selected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedMethod}
            className="min-w-[120px]"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentAssignmentModal;