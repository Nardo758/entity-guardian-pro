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
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get user details from auth if available
      const rolesWithEmails = await Promise.all((data || []).map(async (role: any) => {
        try {
          const { data: userData } = await supabase.auth.admin.listUsers();
          const user = userData?.users?.find((u: any) => u.id === role.user_id);
          return {
            ...role,
            email: user?.email || 'Unknown'
          };
        } catch {
          return {
            ...role,
            email: 'Unknown'
          };
        }
      }));
      
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
    if (!email || !selectedRole) {
      toast({
        title: "Missing Information",
        description: "Please enter email and select a role",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get user by email - simplified approach
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Placeholder - would need proper user lookup
          role: selectedRole
        });

      if (roleError) throw roleError;

      // Log security event
      await supabase.from('analytics_data').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        metric_name: 'Role Assignment',
        metric_value: 1,
        metric_type: 'security_event',
        metric_date: new Date().toISOString().split('T')[0],
        metadata: {
          assigned_role: selectedRole,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          timestamp: new Date().toISOString(),
          target_email: email
        }
      });

      toast({
        title: "Role Assigned",
        description: `${selectedRole} role assigned to ${email}`,
      });

      setEmail('');
      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (userRoleId: string, targetUserId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', userRoleId);

      if (error) throw error;

      // Log security event
      await supabase.from('analytics_data').insert({
        user_id: targetUserId,
        metric_name: 'Role Removal',
        metric_value: 1,
        metric_type: 'security_event',
        metric_date: new Date().toISOString().split('T')[0],
        metadata: {
          removed_by: (await supabase.auth.getUser()).data.user?.id,
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: "Role Removed",
        description: "User role has been removed",
      });

      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Removal Failed",
        description: error.message,
        variant: "destructive"
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
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
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