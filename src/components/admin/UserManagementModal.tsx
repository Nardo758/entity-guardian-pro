import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Ban, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onRoleChange?: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  company_size: string | null;
  plan: string | null;
  user_type: string | null;
  account_status: string | null;
  suspension_reason: string | null;
  suspended_at: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  role: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  open,
  onOpenChange,
  userId,
  onRoleChange
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    company_size: '',
    plan: 'starter',
    user_type: 'owner'
  });
  
  // Role management
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Suspension management
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    if (open && userId) {
      fetchUserData();
    }
  }, [open, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        company: profileData.company || '',
        company_size: profileData.company_size || '',
        plan: profileData.plan || 'starter',
        user_type: profileData.user_type || 'owner'
      });

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      setRoles(rolesData || []);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          company: formData.company,
          company_size: formData.company_size,
          plan: formData.plan,
          user_type: formData.user_type,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['secure-profiles'] });
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole) return;
    
    setSaving(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: selectedRole,
          created_by: currentUser.user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('User already has this role');
        } else {
          throw error;
        }
        return;
      }
      
      toast.success(`Role "${selectedRole}" added successfully`);
      setSelectedRole('');
      fetchUserData();
      onRoleChange?.();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (roleId: string, roleName: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      
      toast.success(`Role "${roleName}" removed`);
      fetchUserData();
      onRoleChange?.();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendAccount = async () => {
    if (!suspensionReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    
    setSaving(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'suspended',
          suspension_reason: suspensionReason,
          suspended_at: new Date().toISOString(),
          suspended_by: currentUser.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Account suspended successfully');
      setSuspensionReason('');
      queryClient.invalidateQueries({ queryKey: ['secure-profiles'] });
      fetchUserData();
    } catch (error) {
      console.error('Error suspending account:', error);
      toast.error('Failed to suspend account');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivateAccount = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'active',
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Account reactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['secure-profiles'] });
      fetchUserData();
    } catch (error) {
      console.error('Error reactivating account:', error);
      toast.error('Failed to reactivate account');
    } finally {
      setSaving(false);
    }
  };

  const availableRoles = ['admin', 'manager', 'user', 'registered_agent'].filter(
    role => !roles.some(r => r.role === role)
  );

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading user data...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="account">Account Status</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, company_size: value }))}
                >
                  <SelectTrigger id="company_size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}
                >
                  <SelectTrigger id="plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_type">User Type</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, user_type: value }))}
              >
                <SelectTrigger id="user_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Business Owner</SelectItem>
                  <SelectItem value="agent">Registered Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Current Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No roles assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Badge 
                        key={role.id} 
                        variant={role.role === 'admin' ? 'destructive' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {role.role}
                        <button
                          onClick={() => handleRemoveRole(role.id, role.role)}
                          className="ml-1 hover:text-destructive-foreground"
                          disabled={saving}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {availableRoles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select role to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddRole} disabled={!selectedRole || saving}>
                      Add Role
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="account" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={profile?.account_status === 'suspended' ? 'destructive' : 'default'}>
                      {profile?.account_status || 'active'}
                    </Badge>
                  </div>
                  
                  {profile?.account_status === 'suspended' && (
                    <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        Account Suspended
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reason: {profile.suspension_reason || 'No reason provided'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Suspended: {profile.suspended_at ? new Date(profile.suspended_at).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Account created: {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {profile?.account_status === 'suspended' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-green-600">Reactivate Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleReactivateAccount} 
                    disabled={saving}
                    variant="outline"
                    className="w-full"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Reactivate Account
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <Ban className="h-4 w-4" />
                    Suspend Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-warning" />
                    <p>Suspending this account will prevent the user from accessing the platform. This action can be reversed.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="suspension_reason">Suspension Reason</Label>
                    <Input
                      id="suspension_reason"
                      value={suspensionReason}
                      onChange={(e) => setSuspensionReason(e.target.value)}
                      placeholder="Enter reason for suspension..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSuspendAccount} 
                    disabled={saving || !suspensionReason.trim()}
                    variant="destructive"
                    className="w-full"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                    Suspend Account
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
