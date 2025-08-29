import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComplianceCheck } from '@/hooks/useComplianceChecks';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ComplianceCheck, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  complianceCheck?: ComplianceCheck;
  entityId?: string;
}

export const ComplianceModal = ({ isOpen, onClose, onSave, complianceCheck, entityId }: ComplianceModalProps) => {
  const [formData, setFormData] = useState({
    check_type: '',
    check_name: '',
    status: 'pending' as 'pending' | 'completed' | 'overdue' | 'failed',
    due_date: '',
    completion_date: '',
    notes: '',
  });

  useEffect(() => {
    if (complianceCheck) {
      setFormData({
        check_type: complianceCheck.check_type,
        check_name: complianceCheck.check_name,
        status: complianceCheck.status,
        due_date: complianceCheck.due_date || '',
        completion_date: complianceCheck.completion_date || '',
        notes: complianceCheck.notes || '',
      });
    } else {
      setFormData({
        check_type: '',
        check_name: '',
        status: 'pending',
        due_date: '',
        completion_date: '',
        notes: '',
      });
    }
  }, [complianceCheck, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        ...formData,
        entity_id: entityId,
      });
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{complianceCheck ? 'Edit Compliance Check' : 'Add Compliance Check'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_type">Check Type *</Label>
              <Select 
                value={formData.check_type} 
                onValueChange={(value) => setFormData({ ...formData, check_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual_report">Annual Report</SelectItem>
                  <SelectItem value="tax_filing">Tax Filing</SelectItem>
                  <SelectItem value="registered_agent">Registered Agent</SelectItem>
                  <SelectItem value="license_renewal">License Renewal</SelectItem>
                  <SelectItem value="audit">Audit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="check_name">Check Name *</Label>
            <Input
              id="check_name"
              value={formData.check_name}
              onChange={(e) => setFormData({ ...formData, check_name: e.target.value })}
              placeholder="e.g., 2024 Annual Report Filing"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="completion_date">Completion Date</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {complianceCheck ? 'Update Check' : 'Add Check'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};