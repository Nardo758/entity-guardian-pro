import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AdminUser } from '@/hooks/useAdminUsers';

interface DeleteAdminDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: AdminUser | null;
}

export const DeleteAdminDialog: React.FC<DeleteAdminDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  admin,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!admin) return;

    setIsDeleting(true);

    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      
      const { data, error } = await supabase.functions.invoke('delete-admin-user', {
        body: { admin_id: admin.id },
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Admin account deleted successfully');
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast.error(error.message || 'Failed to delete admin');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!admin) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">Delete Admin Account</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to delete the admin account for{' '}
            <span className="font-semibold text-foreground">{admin.displayName}</span> ({admin.email})?
            <br /><br />
            This action cannot be undone. The admin will immediately lose access to the admin panel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Admin
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
