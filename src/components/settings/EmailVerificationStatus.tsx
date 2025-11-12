import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

interface EmailVerificationStatusProps {
  isVerified: boolean;
  email: string;
}

export const EmailVerificationStatus = ({ isVerified, email }: EmailVerificationStatusProps) => {
  const [sending, setSending] = useState(false);

  const resendVerificationEmail = async () => {
    try {
      setSending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success("Verification email sent! Check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification email");
    } finally {
      setSending(false);
    }
  };

  if (isVerified) {
    return (
      <Alert className="border-success/50 bg-success/10">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-success">Email verified</span>
            <Badge variant="outline" className="text-success border-success">
              Verified
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-warning/50 bg-warning/10">
      <AlertCircle className="h-4 w-4 text-warning" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-warning font-medium">Email not verified</span>
          <span className="text-xs text-muted-foreground">
            Please check your inbox and verify your email address
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resendVerificationEmail}
          disabled={sending}
          className="ml-4"
        >
          <Mail className="h-4 w-4 mr-2" />
          {sending ? "Sending..." : "Resend"}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
