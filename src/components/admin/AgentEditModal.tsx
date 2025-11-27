import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: {
    id: string;
    user_id: string;
    company_name?: string;
    contact_email?: string;
    bio?: string;
    states: string[];
    price_per_entity: number;
    years_experience?: number;
    is_available: boolean;
  } | null;
  onSave?: () => void;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export const AgentEditModal: React.FC<AgentEditModalProps> = ({
  open,
  onOpenChange,
  agent,
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    bio: '',
    price_per_entity: 0,
    years_experience: 0,
    is_available: true,
    states: [] as string[],
  });
  const [newState, setNewState] = useState('');

  useEffect(() => {
    if (agent) {
      setFormData({
        company_name: agent.company_name || '',
        contact_email: agent.contact_email || '',
        bio: agent.bio || '',
        price_per_entity: agent.price_per_entity || 0,
        years_experience: agent.years_experience || 0,
        is_available: agent.is_available,
        states: agent.states || [],
      });
    }
  }, [agent]);

  const handleSave = async () => {
    if (!agent?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          company_name: formData.company_name || null,
          contact_email: formData.contact_email || null,
          bio: formData.bio || null,
          price_per_entity: formData.price_per_entity,
          years_experience: formData.years_experience || null,
          is_available: formData.is_available,
          states: formData.states,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agent.id);

      if (error) throw error;

      toast.success('Agent updated successfully');
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  const addState = () => {
    if (newState && !formData.states.includes(newState)) {
      setFormData(prev => ({
        ...prev,
        states: [...prev.states, newState].sort(),
      }));
      setNewState('');
    }
  };

  const removeState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      states: prev.states.filter(s => s !== state),
    }));
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              placeholder="Enter contact email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Enter bio..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price per Entity ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price_per_entity}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_entity: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.years_experience}
                onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div>
              <Label>Availability Status</Label>
              <p className="text-sm text-muted-foreground">Agent can receive new clients</p>
            </div>
            <Switch
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label>States Covered</Label>
            <div className="flex gap-2">
              <select
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select state to add</option>
                {US_STATES.filter(s => !formData.states.includes(s)).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <Button type="button" variant="outline" size="icon" onClick={addState} disabled={!newState}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.states.map(state => (
                <Badge key={state} variant="secondary" className="flex items-center gap-1">
                  {state}
                  <button onClick={() => removeState(state)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {formData.states.length === 0 && (
                <p className="text-sm text-muted-foreground">No states selected</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentEditModal;
