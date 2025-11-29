import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { AdminUser } from '@/hooks/useAdminUsers';

interface ResetAdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: AdminUser | null;
}

export const ResetAdminPasswordModal: React.FC<ResetAdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  admin,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setSendEmail(true);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) return;

    if (!newPassword || newPassword.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      
      const { data, error } = await supabase.functions.invoke('reset-admin-password', {
        body: {
          admin_id: admin.id,
          new_password: newPassword,
          send_email: sendEmail,
        },
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Password reset successfully');
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!admin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Reset Admin Password</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set a new password for {admin.displayName} ({admin.email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="newPassword" className="text-foreground">New Password *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generatePassword}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate
              </Button>
            </div>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 12 characters"
                className="pr-10"
                minLength={12}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
            <Label htmlFor="sendEmail" className="text-sm text-foreground cursor-pointer">
              Send new password via email to the admin
            </Label>
          </div>

          <p className="text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
            Note: The admin will be logged out of all sessions and will need to use the new password to login.
          </p>

          <div className="flex justify-end gap-3 pt-2">
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
              Reset Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
