import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  User,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { ManagedEntity } from '@/hooks/useAdminEntityManagement';
import { format } from 'date-fns';

interface EntityManagementModalProps {
  entity: ManagedEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (entityId: string, updates: Record<string, any>) => void;
  onDelete: (entityId: string) => void;
  isUpdating: boolean;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const ENTITY_TYPES = ['LLC', 'Corporation', 'S-Corp', 'Partnership', 'Sole Proprietorship', 'Non-Profit'];

const EntityManagementModal: React.FC<EntityManagementModalProps> = ({
  entity,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  isUpdating,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState('');
  const [formationDate, setFormationDate] = useState('');
  const [agentFee, setAgentFee] = useState('');
  const [directorFee, setDirectorFee] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (entity) {
      setName(entity.name || '');
      setType(entity.type || '');
      setState(entity.state || '');
      setStatus(entity.status || 'active');
      setFormationDate(entity.formation_date || '');
      setAgentFee(entity.registered_agent_fee?.toString() || '');
      setDirectorFee(entity.independent_director_fee?.toString() || '');
      setShowDeleteConfirm(false);
    }
  }, [entity]);

  if (!entity) return null;

  const handleSave = () => {
    onUpdate(entity.id, {
      name,
      type,
      state,
      status,
      formation_date: formationDate || null,
      registered_agent_fee: agentFee ? parseFloat(agentFee) : null,
      independent_director_fee: directorFee ? parseFloat(directorFee) : null,
    });
  };

  const handleDelete = () => {
    onDelete(entity.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Manage Entity
          </DialogTitle>
          <DialogDescription>
            View and manage entity details.
          </DialogDescription>
        </DialogHeader>

        {/* Owner Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium mb-2">Owner Information</h4>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Owner:</span>
            <span className="font-medium">{entity.owner_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{entity.owner_email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">
              {format(new Date(entity.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entityName">Entity Name</Label>
            <Input
              id="entityName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entity name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="dissolved">Dissolved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formationDate">Formation Date</Label>
              <Input
                id="formationDate"
                type="date"
                value={formationDate}
                onChange={(e) => setFormationDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agentFee" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Registered Agent Fee
              </Label>
              <Input
                id="agentFee"
                type="number"
                step="0.01"
                value={agentFee}
                onChange={(e) => setAgentFee(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="directorFee" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Director Fee
              </Label>
              <Input
                id="directorFee"
                type="number"
                step="0.01"
                value={directorFee}
                onChange={(e) => setDirectorFee(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-destructive">Confirm delete?</span>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Yes, Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="sm:mr-auto"
            >
              Delete Entity
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntityManagementModal;
