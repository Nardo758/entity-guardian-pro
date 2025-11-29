import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AdminUser } from '@/hooks/useAdminUsers';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: AdminUser | null;
}

const PERMISSION_OPTIONS = [
  { id: 'all', label: 'Full Access', description: 'Complete admin privileges' },
  { id: 'users', label: 'User Management', description: 'Manage user accounts' },
  { id: 'billing', label: 'Billing', description: 'View and manage billing' },
  { id: 'support', label: 'Support', description: 'Handle support tickets' },
  { id: 'analytics', label: 'Analytics', description: 'View analytics data' },
  { id: 'settings', label: 'Settings', description: 'Modify system settings' },
];

export const EditAdminModal: React.FC<EditAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  admin,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<string>('all');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (admin) {
      setDisplayName(admin.displayName || '');
      setSelectedPermission(admin.permissions?.[0] || 'all');
      setIsActive(admin.is_active);
    }
  }, [admin]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) return;

    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      
      const { data, error } = await supabase.functions.invoke('update-admin-user', {
        body: {
          admin_id: admin.id,
          display_name: displayName.trim(),
          permissions: [selectedPermission],
          is_active: isActive,
        },
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Admin account updated successfully');
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error updating admin:', error);
      toast.error(error.message || 'Failed to update admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!admin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Admin</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update administrator account for {admin.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={admin.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-foreground">Display Name *</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-foreground">Permissions</Label>
            <RadioGroup 
              value={selectedPermission} 
              onValueChange={setSelectedPermission}
              className="grid grid-cols-2 gap-3"
            >
              {PERMISSION_OPTIONS.map((perm) => (
                <div key={perm.id} className="flex items-start space-x-3">
                  <RadioGroupItem 
                    value={perm.id} 
                    id={`edit-${perm.id}`}
                    className="mt-0.5"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label 
                      htmlFor={`edit-${perm.id}`} 
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {perm.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{perm.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-foreground">Account Status</Label>
              <p className="text-xs text-muted-foreground">
                {isActive ? 'Admin can access the panel' : 'Admin cannot login'}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
