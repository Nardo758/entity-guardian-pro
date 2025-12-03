import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Ban, RefreshCw, AlertTriangle, CreditCard, Gift, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userData?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    company_size: string | null;
    plan: string | null;
    user_type: string | null;
    account_status: string | null;
    roles: string[];
    subscribed: boolean;
    subscription_tier: string | null;
    is_trial_active: boolean;
    entities_limit: number | null;
    created_at: string;
  };
  onRoleChange?: () => void;
  onRefetch?: () => void;
  initialTab?: 'profile' | 'subscription' | 'roles' | 'account';
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  open,
  onOpenChange,
  userId,
  userData,
  onRoleChange,
  onRefetch,
  initialTab = 'profile'
}) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Reset to initialTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);
  
  // Form state - initialized from userData
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    company: '',
    company_size: '',
    plan: 'starter',
    user_type: 'owner'
  });
  
  // Subscription form state
  const [subFormData, setSubFormData] = useState({
    subscribed: false,
    subscription_tier: 'starter',
    is_trial_active: false,
    entities_limit: 4,
  });
  
  // Role management
  const [selectedRole, setSelectedRole] = useState<string>('');
  
  // Suspension management
  const [suspensionReason, setSuspensionReason] = useState('');

  // Initialize form data when userData changes
  useEffect(() => {
    if (open && userData) {
      setFormData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        company: userData.company || '',
        company_size: userData.company_size || '',
        plan: userData.plan || 'starter',
        user_type: userData.user_type || 'owner'
      });
      setSubFormData({
        subscribed: userData.subscribed || false,
        subscription_tier: userData.subscription_tier || 'starter',
        is_trial_active: userData.is_trial_active || false,
        entities_limit: userData.entities_limit || 4,
      });
    }
  }, [open, userData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast.error('Admin session expired');
        return;
      }

      const { error } = await supabase.functions.invoke('admin-get-users', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: { 
          action: 'update_profile',
          userId,
          profileData: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            company: formData.company,
            company_size: formData.company_size,
            plan: formData.plan,
            user_type: formData.user_type,
          }
        }
      });

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      onRefetch?.();
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
      const sessionToken = sessionStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast.error('Admin session expired');
        return;
      }

      const { error } = await supabase.functions.invoke('admin-get-users', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: { 
          action: 'add_role',
          userId,
          role: selectedRole
        }
      });

      if (error) throw error;
      
      toast.success(`Role "${selectedRole}" added successfully`);
      setSelectedRole('');
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      onRefetch?.();
      onRoleChange?.();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    setSaving(true);
    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast.error('Admin session expired');
        return;
      }

      const { error } = await supabase.functions.invoke('admin-get-users', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: { 
          action: 'remove_role',
          userId,
          role: roleName
        }
      });

      if (error) throw error;
      
      toast.success(`Role "${roleName}" removed`);
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      onRefetch?.();
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
      const sessionToken = sessionStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast.error('Admin session expired');
        return;
      }

      const { error } = await supabase.functions.invoke('admin-get-users', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: { 
          action: 'suspend_user',
          userId,
          reason: suspensionReason
        }
      });

      if (error) throw error;
      
      toast.success('Account suspended successfully');
      setSuspensionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      onRefetch?.();
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
      const sessionToken = sessionStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast.error('Admin session expired');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: { 
          action: 'unsuspend_user',
          userId
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success('Account reactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      onRefetch?.();
      onOpenChange(false); // Close modal so fresh data is shown on re-open
    } catch (error) {
      console.error('Error reactivating account:', error);
      toast.error('Failed to reactivate account');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubscription = async () => {
    setSaving(true);
    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast.error('Admin session expired');
        return;
      }

      const { error } = await supabase.functions.invoke('admin-get-users', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: { 
          action: 'update_subscription',
          userId,
          subscriptionData: {
            subscribed: subFormData.subscribed,
            subscription_tier: subFormData.subscription_tier,
            is_trial_active: subFormData.is_trial_active,
            entities_limit: subFormData.entities_limit,
          }
        }
      });

      if (error) throw error;
      
      toast.success('Subscription updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      onRefetch?.();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleGrantFreeAccess = async (tier: string) => {
    setSaving(true);
    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      if (!sessionToken) {
        toast.error('Admin session expired');
        return;
      }

      const { error } = await supabase.functions.invoke('admin-get-users', {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: { 
          action: 'grant_free_access',
          userId,
          tier
        }
      });

      if (error) throw error;
      
      toast.success(`Free ${tier} access granted successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-managed-users'] });
      onRefetch?.();
    } catch (error) {
      console.error('Error granting free access:', error);
      toast.error('Failed to grant free access');
    } finally {
      setSaving(false);
    }
  };

  const userRoles = userData?.roles || [];
  const availableRoles = ['admin', 'manager', 'user', 'registered_agent'].filter(
    role => !userRoles.includes(role)
  );

  // Show loading state if no userData
  if (!userData) {
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
            User Management - {userData.email}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'profile' | 'subscription' | 'roles' | 'account')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
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

          <TabsContent value="subscription" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={userData.subscribed ? 'default' : 'secondary'}>
                      {userData.subscribed ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tier:</span>
                    <Badge variant="outline" className="capitalize">
                      {userData.subscription_tier || 'None'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trial Active:</span>
                    <Badge variant={userData.is_trial_active ? 'default' : 'secondary'}>
                      {userData.is_trial_active ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Entity Limit:</span>
                    <span className="font-medium">{userData.entities_limit || 4}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <Gift className="h-4 w-4" />
                  Grant Free Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Grant this user free premium access without payment.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGrantFreeAccess('starter')}
                    disabled={saving}
                  >
                    Grant Starter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGrantFreeAccess('pro')}
                    disabled={saving}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Grant Pro
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleGrantFreeAccess('unlimited')}
                    disabled={saving}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Grant Unlimited
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Manual Override</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="subscribed">Subscribed</Label>
                    <Switch
                      id="subscribed"
                      checked={subFormData.subscribed}
                      onCheckedChange={(checked) => setSubFormData(prev => ({ ...prev, subscribed: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trial_active">Trial Active</Label>
                    <Switch
                      id="trial_active"
                      checked={subFormData.is_trial_active}
                      onCheckedChange={(checked) => setSubFormData(prev => ({ ...prev, is_trial_active: checked }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sub_tier">Subscription Tier</Label>
                    <Select
                      value={subFormData.subscription_tier}
                      onValueChange={(value) => setSubFormData(prev => ({ ...prev, subscription_tier: value }))}
                    >
                      <SelectTrigger id="sub_tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entities_limit">Entity Limit</Label>
                    <Input
                      id="entities_limit"
                      type="number"
                      value={subFormData.entities_limit}
                      onChange={(e) => setSubFormData(prev => ({ ...prev, entities_limit: parseInt(e.target.value) || 4 }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveSubscription} disabled={saving}>
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                {userRoles.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No roles assigned</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userRoles.map((role) => (
                      <Badge 
                        key={role} 
                        variant={role === 'admin' ? 'destructive' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        {role}
                        <button
                          onClick={() => handleRemoveRole(role)}
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
                    <Badge variant={userData.account_status === 'suspended' ? 'destructive' : 'default'}>
                      {userData.account_status || 'active'}
                    </Badge>
                  </div>
                  
                  {userData.account_status === 'suspended' && (
                    <div className="bg-destructive/10 p-4 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-destructive">
                        Account Suspended
                      </p>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Account created: {userData.created_at ? new Date(userData.created_at).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {userData.account_status === 'suspended' ? (
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
