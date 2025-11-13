import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smartphone, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const SMSVerificationStatus = () => {
  const { user, profile } = useAuth();
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState((profile as any)?.phone_number || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isVerified = (profile as any)?.phone_verified || false;
  const hasPhone = !!(profile as any)?.phone_number;

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      // Call edge function to send SMS
      const { error } = await supabase.functions.invoke('sms-verification', {
        body: { phone: phoneNumber, action: 'send' }
      });

      if (error) throw error;

      setCodeSent(true);
      toast.success("Verification code sent to your phone");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      // Call edge function to verify code
      const { error } = await supabase.functions.invoke('sms-verification', {
        body: { phone: phoneNumber, code: verificationCode, action: 'verify' }
      });

      if (error) throw error;

      // Update profile with verified phone
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          phone_number: phoneNumber,
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      toast.success("Phone number verified successfully!");
      setShowVerifyDialog(false);
      setCodeSent(false);
      setVerificationCode("");
    } catch (error: any) {
      toast.error(error.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhone = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          phone_number: null,
          phone_verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success("Phone number removed");
      setPhoneNumber("");
    } catch (error: any) {
      toast.error("Failed to remove phone number");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Phone Verification
          </CardTitle>
          <CardDescription>
            Add an extra layer of security with phone verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Phone Number</p>
                {isVerified ? (
                  <Badge className="bg-success text-white flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : hasPhone ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Added</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {hasPhone ? (profile as any)?.phone_number : "No phone number added"}
              </p>
            </div>
            <div className="flex gap-2">
              {!isVerified && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowVerifyDialog(true)}
                >
                  {hasPhone ? "Verify" : "Add Phone"}
                </Button>
              )}
              {hasPhone && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhone}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {isVerified && (
            <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <Shield className="h-5 w-5 text-success mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-success">Phone Verified</p>
                <p className="text-muted-foreground">
                  Your phone number can be used for two-factor authentication and account recovery
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasPhone ? "Verify Phone Number" : "Add Phone Number"}
            </DialogTitle>
            <DialogDescription>
              {codeSent 
                ? "Enter the 6-digit code sent to your phone"
                : "We'll send you a verification code via SMS"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!codeSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSendCode} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setCodeSent(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
