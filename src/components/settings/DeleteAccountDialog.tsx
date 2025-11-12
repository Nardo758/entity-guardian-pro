import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export const DeleteAccountDialog = ({ open, onOpenChange, userEmail }: DeleteAccountDialogProps) => {
  const navigate = useNavigate();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setExporting(true);
      
      // Fetch user data from various tables
      const { data: profile } = await supabase.from('profiles').select('*').single();
      const { data: entities } = await supabase.from('entities').select('*');
      const { data: notifications } = await supabase.from('notifications').select('*');
      
      const exportData = {
        profile,
        entities,
        notifications,
        exportDate: new Date().toISOString(),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `account-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
    } catch (error: any) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== userEmail) {
      toast.error("Email doesn't match. Please type your email correctly.");
      return;
    }

    setLoading(true);
    try {
      // Create deletion request
      const { error: requestError } = await supabase
        .from('account_deletion_requests')
        .insert({
          reason: reason || null,
          status: 'pending'
        });

      if (requestError) throw requestError;

      toast.success("Account deletion requested. Your account will be deleted in 30 days.");
      
      // Sign out user
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Failed to request account deletion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Your account will be permanently deleted after 30 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              All your data including entities, documents, and settings will be permanently deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleExportData}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export My Data First"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for leaving (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Help us improve by sharing why you're leaving..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">
              Type <span className="font-semibold">{userEmail}</span> to confirm
            </Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder="Enter your email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={loading || confirmEmail !== userEmail}
            className="w-full sm:w-auto"
          >
            {loading ? "Processing..." : "Delete My Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
