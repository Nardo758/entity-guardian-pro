import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, User, Shield, CreditCard, Users, ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import AdminRoleManager from "@/components/AdminRoleManager";
import { AdminAuditDashboard } from "@/components/AdminAuditDashboard";
import MFASetup from "@/components/MFASetup";
import { MFARecoveryCodesManager } from "@/components/MFARecoveryCodesManager";
import { PasswordChangeDialog } from "@/components/settings/PasswordChangeDialog";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { EmailVerificationStatus } from "@/components/settings/EmailVerificationStatus";
import { ActiveSessions } from "@/components/settings/ActiveSessions";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { SecurityAlerts } from "@/components/SecurityAlerts";
import { PaymentMethodManager } from "@/components/payment/PaymentMethodManager";
import { InvoiceHistory } from "@/components/billing/InvoiceHistory";
import { UsageMetrics } from "@/components/billing/UsageMetrics";
import { SMSVerificationStatus } from "@/components/security/SMSVerificationStatus";
import { DataExport } from "@/components/settings/DataExport";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAdminMFA } from "@/hooks/useAdminMFA";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useTierPermissions } from "@/hooks/useTierPermissions";

const Settings = () => {
  const navigate = useNavigate();
  const { hasAdminAccess, isAdmin } = useAdminAccess();
  const { isMFAEnabled } = useAdminMFA();
  const { user, profile: authProfile } = useAuth();
  const { subscription, loading: subLoading, openCustomerPortal } = useSubscription();
  const { currentTier } = useTierPermissions();
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settingsProfile, setSettingsProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    role: "Legal Director",
    avatar: "",
    phone: ""
  });

  // Sync email and profile from authenticated user/profile into local state
  useEffect(() => {
    const authEmail = user?.email || "";
    const firstName = (authProfile as any)?.first_name || "";
    const lastName = (authProfile as any)?.last_name || "";
    const company = (authProfile as any)?.company || "";
    const phone = (authProfile as any)?.phone_number || "";
    const avatar = (authProfile as any)?.avatar_url || "";
    setSettingsProfile(prev => ({
      ...prev,
      email: authEmail,
      first_name: firstName,
      last_name: lastName,
      company,
      phone,
      avatar
    }));
  }, [user, authProfile]);

  const handleSaveProfile = async () => {
    try {
      if (!user) return;
      const updates: any = {
        user_id: user.id,
        first_name: settingsProfile.first_name || null,
        last_name: settingsProfile.last_name || null,
        company: settingsProfile.company || null,
        phone_number: settingsProfile.phone || null,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Update auth email if changed
      if (settingsProfile.email && settingsProfile.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: settingsProfile.email });
        if (emailError) throw emailError;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Update Failed",
        description: e?.message || 'Could not update profile',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-muted-foreground">Manage your account preferences and security settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <AvatarUpload
                  avatarUrl={settingsProfile.avatar}
                  onAvatarChange={(url) => setSettingsProfile(prev => ({ ...prev, avatar: url || "" }))}
                  userName={`${settingsProfile.first_name} ${settingsProfile.last_name}`.trim()}
                />
                <Separator className="my-4" />
                <div className="text-center space-y-1">
                  <p className="font-semibold">{`${settingsProfile.first_name} ${settingsProfile.last_name}`.trim()}</p>
                  <p className="text-sm text-muted-foreground">{settingsProfile.email}</p>
                  <Badge variant="secondary" className="mt-2 capitalize">{currentTier}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Settings Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className={`grid w-full ${hasAdminAccess ? 'grid-cols-6' : 'grid-cols-4'}`}>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing
                </TabsTrigger>
                {hasAdminAccess && (
                  <>
                    <TabsTrigger value="admin" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Admin
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Audit
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your personal and company information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <EmailVerificationStatus 
                      isVerified={user?.email_confirmed_at != null}
                      email={settingsProfile.email}
                    />
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                          id="first_name"
                          value={settingsProfile.first_name}
                          onChange={(e) => setSettingsProfile(prev => ({ ...prev, first_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={settingsProfile.last_name}
                          onChange={(e) => setSettingsProfile(prev => ({ ...prev, last_name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settingsProfile.email}
                          onChange={(e) => setSettingsProfile(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={settingsProfile.company}
                          onChange={(e) => setSettingsProfile(prev => ({ ...prev, company: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={settingsProfile.phone}
                          onChange={(e) => setSettingsProfile(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-end">
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <NotificationPreferences />
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your account security and authentication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={isMFAEnabled ? "default" : "secondary"}>
                          {isMFAEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Button 
                          variant={isMFAEnabled ? "outline" : "default"} 
                          size="sm"
                          onClick={() => setShowMFASetup(true)}
                        >
                          {isMFAEnabled ? "Manage" : "Enable MFA"}
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <Label>Password</Label>
                        <p className="text-sm text-muted-foreground">
                          Keep your password strong and unique
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                        Change Password
                      </Button>
                    </div>

                    {isAdmin && isMFAEnabled && (
                      <>
                        <Separator />
                        <div>
                          <MFARecoveryCodesManager />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <ActiveSessions />

                <SMSVerificationStatus />

                <SecurityAlerts />

                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible actions that affect your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing Information</CardTitle>
                    <CardDescription>Manage your subscription and payment methods</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {subLoading ? (
                      <div className="p-4 text-center text-muted-foreground">Loading subscription...</div>
                    ) : subscription.subscribed ? (
                      <>
                        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-success capitalize">{subscription.subscription_tier || currentTier} Plan</h3>
                              <p className="text-sm text-muted-foreground">
                                {subscription.subscription_end 
                                  ? `Next billing: ${new Date(subscription.subscription_end).toLocaleDateString()}`
                                  : 'Active subscription'}
                              </p>
                            </div>
                            <Badge className="bg-success text-white">Active</Badge>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex flex-col gap-3">
                            <Button onClick={openCustomerPortal} className="w-full">
                              Manage Subscription
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                              Update payment method, view invoices, and manage your billing through Stripe
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-muted/50 border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-4">No active subscription</p>
                        <Button onClick={() => navigate('/billing')} variant="default">
                          View Plans
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <UsageMetrics />

                <PaymentMethodManager />

                <InvoiceHistory />

                <DataExport />
              </TabsContent>

              {hasAdminAccess && (
                <>
                  <TabsContent value="admin" className="space-y-6">
                    <AdminRoleManager />
                  </TabsContent>
                  
                  <TabsContent value="audit" className="space-y-6">
                    <AdminAuditDashboard />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={showMFASetup} onOpenChange={setShowMFASetup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Multi-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enhance your account security with two-factor authentication
            </DialogDescription>
          </DialogHeader>
          <MFASetup onComplete={() => setShowMFASetup(false)} />
        </DialogContent>
      </Dialog>

      <PasswordChangeDialog 
        open={showPasswordDialog} 
        onOpenChange={setShowPasswordDialog} 
      />

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        userEmail={settingsProfile.email}
      />
    </div>
  );
};

export default Settings;