import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Officer } from '@/hooks/useOfficers';

interface OfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Officer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  officer?: Officer;
  entityId: string;
}

export const OfficerModal = ({ isOpen, onClose, onSave, officer, entityId }: OfficerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    appointment_date: '',
    is_active: true,
  });

  useEffect(() => {
    if (officer) {
      setFormData({
        name: officer.name,
        title: officer.title,
        email: officer.email || '',
        phone: officer.phone || '',
        address: officer.address || '',
        appointment_date: officer.appointment_date || '',
        is_active: officer.is_active,
      });
    } else {
      setFormData({
        name: '',
        title: '',
        email: '',
        phone: '',
        address: '',
        appointment_date: '',
        is_active: true,
      });
    }
  }, [officer, isOpen]);

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
          <DialogTitle>{officer ? 'Edit Officer' : 'Add Officer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., President, Secretary"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="appointment_date">Appointment Date</Label>
            <Input
              id="appointment_date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="is_active">Active Officer</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {officer ? 'Update Officer' : 'Add Officer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};