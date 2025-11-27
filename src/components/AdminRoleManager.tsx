import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Shield, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'manager';
  created_at: string;
  email?: string;
}

const AdminRoleManager: React.FC = () => {
  const { toast } = useToast();
  const { hasAdminAccess, isAdmin } = useAdminAccess();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user' | 'manager'>('user');

  useEffect(() => {
    if (hasAdminAccess) {
      fetchUserRoles();
    }
  }, [hasAdminAccess]);

  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      // Fetch roles with profile data joined
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles!user_roles_user_id_fkey(user_id, first_name, last_name, company)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Also fetch profiles to get email-like identifier
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, company');
      
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      
      const rolesWithEmails = (data || []).map((role: any) => {
        const profile = profileMap.get(role.user_id);
        const displayName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.company || 'Unknown'
          : 'Unknown';
        return {
          ...role,
          email: displayName,
          profile
        };
      });
      
      setUserRoles(rolesWithEmails);
    } catch (error: any) {
      toast({
        title: "Error Loading Roles",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async () => {
    if (!email.trim() || !selectedRole) {
      toast({
        title: "Validation Error",
        description: "Please enter a user name or company and select a role",
        variant: "destructive",
      });
      return;
    }

    if (!hasAdminAccess) {
      toast({
        title: "Access Denied",
        description: "Insufficient permissions to assign roles",
        variant: "destructive",
      });
      // Log security event for unauthorized access attempt
      await supabase.rpc('log_security_event', {
        event_type: 'role_assignment_unauthorized_attempt',
        event_data: { search_term: email.trim(), attempted_role: selectedRole }
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user for security checks
      const currentUser = await supabase.auth.getUser();
      
      // Find user by searching profiles - use the email input as a search term
      // for name, company, or we need to look up via user_id
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, company');

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        toast({
          title: "Error",
          description: "Failed to search users",
          variant: "destructive",
        });
        return;
      }

      // Search for user by name or company (since we can't access emails directly)
      const searchTerm = email.trim().toLowerCase();
      const targetProfile = profiles?.find((p: any) => {
        const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().trim();
        const company = (p.company || '').toLowerCase();
        return fullName.includes(searchTerm) || company.includes(searchTerm) || searchTerm.includes(fullName);
      });
      
      if (!targetProfile) {
        toast({
          title: "User Not Found",
          description: "No user found matching that name/company. Enter the user's name or company name.",
          variant: "destructive",
        });
        await supabase.rpc('log_security_event', {
          event_type: 'user_not_found',
          event_data: { search_term: email.trim() }
        });
        return;
      }

      // Security check: Prevent self-role assignment to non-admin users
      if (targetProfile.user_id === currentUser.data.user?.id && selectedRole !== 'admin') {
        toast({
          title: "Security Error",
          description: "Cannot modify your own role",
          variant: "destructive",
        });
        await supabase.rpc('log_security_event', {
          event_type: 'self_role_modification_attempt',
          event_data: { attempted_role: selectedRole }
        });
        return;
      }

      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', targetProfile.user_id)
        .eq('role', selectedRole)
        .single();

      if (existingRole) {
        toast({
          title: "Role Already Exists",
          description: `User already has the ${selectedRole} role`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: targetProfile.user_id,
            role: selectedRole,
            created_by: currentUser.data.user?.id,
          },
        ]);

      if (error) {
        console.error('Error assigning role:', error);
        toast({
          title: "Error",
          description: "Failed to assign role",
          variant: "destructive",
        });
        await supabase.rpc('log_security_event', {
          event_type: 'role_assignment_failed',
          event_data: { 
            error: error.message, 
            target_user_id: targetProfile.user_id,
            attempted_role: selectedRole 
          }
        });
        return;
      }

      // Success logging is handled by the database trigger
      toast({
        title: "Success",
        description: `Role ${selectedRole} assigned to ${email} successfully`,
      });

      setEmail('');
      setSelectedRole('user');
      fetchUserRoles();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
      await supabase.rpc('log_security_event', {
        event_type: 'role_assignment_unexpected_error',
        event_data: { error: String(error) }
      });
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (userRoleId: string, targetUserId: string) => {
    if (!hasAdminAccess) {
      toast({
        title: "Access Denied",
        description: "Insufficient permissions to remove roles",
        variant: "destructive",
      });
      await supabase.rpc('log_security_event', {
        event_type: 'role_removal_unauthorized_attempt',
        event_data: { target_user_id: targetUserId }
      });
      return;
    }

    // Security check: Prevent removing own admin role
    const currentUser = await supabase.auth.getUser();
    if (targetUserId === currentUser.data.user?.id) {
      toast({
        title: "Security Error",
        description: "Cannot remove your own role",
        variant: "destructive",
      });
      await supabase.rpc('log_security_event', {
        event_type: 'self_role_removal_attempt',
        event_data: { user_role_id: userRoleId }
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);

      if (error) {
        console.error('Error removing role:', error);
        toast({
          title: "Removal Failed",
          description: error.message,
          variant: "destructive"
        });
        await supabase.rpc('log_security_event', {
          event_type: 'role_removal_failed',
          event_data: { 
            error: error.message, 
            target_user_id: targetUserId,
            user_role_id: userRoleId 
          }
        });
        return;
      }

      // Success logging is handled by the database trigger
      toast({
        title: "Role Removed",
        description: "User role has been removed",
      });

      fetchUserRoles();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({
        title: "Removal Failed",
        description: error.message,
        variant: "destructive"
      });
      await supabase.rpc('log_security_event', {
        event_type: 'role_removal_unexpected_error',
        event_data: { error: String(error), target_user_id: targetUserId }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasAdminAccess) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to manage user roles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assign User Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">User Name or Company</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter user name or company"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={assignRole} disabled={loading} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current User Roles */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userRoles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No user roles assigned</p>
            ) : (
              userRoles.map((userRole) => (
                <div key={userRole.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">
                        {userRole.email}
                      </p>
                      <p className="text-sm text-muted-foreground">User ID: {userRole.user_id.slice(0, 8)}...</p>
                    </div>
                    <Badge variant={userRole.role === 'admin' ? 'destructive' : userRole.role === 'manager' ? 'secondary' : 'outline'}>
                      {userRole.role}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRole(userRole.id, userRole.user_id)}
                    disabled={loading}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRoleManager;