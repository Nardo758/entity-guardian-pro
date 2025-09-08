import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Entity } from '@/types/entity';
import { UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity;
}

const AddAgentModal: React.FC<AddAgentModalProps> = ({ 
  isOpen, 
  onClose, 
  entity 
}) => {
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentFee, setAgentFee] = useState('199');
  const [loading, setLoading] = useState(false);

  const handleAddAgent = async () => {
    if (!agentName.trim() || !agentEmail.trim()) {
      toast.error('Please enter agent name and email');
      return;
    }

    setLoading(true);
    try {
      // Here you would typically update the entity with the agent information
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success(`Agent ${agentName} has been added to ${entity.name}`);
      resetModal();
    } catch (error) {
      toast.error('Failed to add agent');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setAgentName('');
    setAgentEmail('');
    setAgentPhone('');
    setAgentFee('199');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Registered Agent for {entity.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entity Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">{entity.name}</h4>
            <p className="text-sm text-muted-foreground">
              {entity.type.toUpperCase()} • {entity.state} • Formed: {entity.formation_date}
            </p>
          </div>

          {/* Agent Information Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent-name">Agent Name/Company *</Label>
              <Input
                id="agent-name"
                placeholder="e.g., John Smith & Associates"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="agent-email">Email Address *</Label>
              <Input
                id="agent-email"
                type="email"
                placeholder="agent@example.com"
                value={agentEmail}
                onChange={(e) => setAgentEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="agent-phone">Phone Number</Label>
              <Input
                id="agent-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={agentPhone}
                onChange={(e) => setAgentPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="agent-fee">Annual Service Fee ($)</Label>
              <Input
                id="agent-fee"
                type="number"
                placeholder="199"
                value={agentFee}
                onChange={(e) => setAgentFee(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="bg-info/5 border border-info/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-info mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-info mb-1">Manual Agent Addition</h4>
                <p className="text-sm text-muted-foreground">
                  Adding an agent manually means they are already confirmed to serve as your registered agent. 
                  This will immediately update your entity records and cost calculations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAddAgent}
              disabled={!agentName.trim() || !agentEmail.trim() || loading}
              className="flex-1"
            >
              {loading ? 'Adding Agent...' : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Agent
                </>
              )}
            </Button>
            <Button variant="outline" onClick={resetModal}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAgentModal;