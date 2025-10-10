import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, User, Shield, CreditCard, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import AdminRoleManager from "@/components/AdminRoleManager";
import SecurityAuditLog from "@/components/SecurityAuditLog";
import MFASetup from "@/components/MFASetup";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { hasAdminAccess } = useAdminAccess();
  const { user, profile: authProfile } = useAuth();
  const [showMFASetup, setShowMFASetup] = useState(false);
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
    setSettingsProfile(prev => ({
      ...prev,
      email: authEmail,
      first_name: firstName,
      last_name: lastName,
      company,
      phone
    }));
  }, [user, authProfile]);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    weeklyReports: true,
    urgentOnly: false
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: true,
    lastPasswordChange: "2024-01-15"
  });

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

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
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
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={settingsProfile.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {(settingsProfile.first_name + ' ' + settingsProfile.last_name).trim().split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{(settingsProfile.first_name + ' ' + settingsProfile.last_name).trim()}</p>
                      <p className="text-xs text-muted-foreground">{settingsProfile.role}</p>
                      <Badge variant="secondary" className="text-xs mt-1">Pro Plan</Badge>
                    </div>
                  </div>
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
                        <Badge variant={security.twoFactorEnabled ? "default" : "secondary"}>
                          {security.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Button 
                          variant={security.twoFactorEnabled ? "outline" : "default"} 
                          size="sm"
                          onClick={() => setShowMFASetup(true)}
                        >
                          {security.twoFactorEnabled ? "Manage" : "Enable MFA"}
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div>
                        <Label>Password</Label>
                        <p className="text-sm text-muted-foreground">
                          Last changed: {new Date(security.lastPasswordChange).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline">Change Password</Button>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <Label>Active Sessions</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-muted-foreground">Chrome on Windows • New York, NY</p>
                          </div>
                          <Badge variant="outline" className="text-success">Active</Badge>
                        </div>
                      </div>
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
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-success">Pro Plan</h3>
                          <p className="text-sm text-muted-foreground">$49/month • Next billing: Jan 15, 2024</p>
                        </div>
                        <Badge className="bg-success text-white">Active</Badge>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <Label>Payment Method</Label>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-5 bg-primary rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-white">••••</span>
                          </div>
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Update</Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button variant="outline">View Invoices</Button>
                      <Button variant="outline">Download Receipt</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {hasAdminAccess && (
                <>
                  <TabsContent value="admin" className="space-y-6">
                    <AdminRoleManager />
                  </TabsContent>
                  
                  <TabsContent value="audit" className="space-y-6">
                    <SecurityAuditLog />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;