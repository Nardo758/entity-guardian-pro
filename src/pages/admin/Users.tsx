import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users as UsersIcon, Search, MoreHorizontal, Eye, Edit,
  RefreshCw, UserCheck, UserX, Building2, CreditCard,
  Shield, UserPlus, Crown, Trash2, KeyRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminUserManagement, ManagedUser } from '@/hooks/useAdminUserManagement';
import { UserManagementModal } from '@/components/admin/UserManagementModal';
import { CreateAdminModal } from '@/components/admin/CreateAdminModal';
import { EditAdminModal } from '@/components/admin/EditAdminModal';
import { DeleteAdminDialog } from '@/components/admin/DeleteAdminDialog';
import { ResetAdminPasswordModal } from '@/components/admin/ResetAdminPasswordModal';
import { useAdminUsers, AdminUser } from '@/hooks/useAdminUsers';
import { toast } from 'sonner';

const Users: React.FC = () => {
  const {
    users,
    isLoading,
    refetch,
    updateUser,
    suspendUser,
    unsuspendUser,
    isUpdating,
    isSuspending,
  } = useAdminUserManagement();

  const { adminUsers, isLoading: isLoadingAdmins, refetch: refetchAdmins } = useAdminUsers();

  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
  const [deleteAdminDialogOpen, setDeleteAdminDialogOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.company || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;
      const matchesType = typeFilter === 'all' || user.user_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [users, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.account_status === 'active' || !u.account_status).length,
    suspended: users.filter(u => u.account_status === 'suspended').length,
    subscribed: users.filter(u => u.subscribed).length,
    byType: users.reduce((acc, u) => {
      const type = u.user_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  }), [users]);

  const handleOpenModal = (user: ManagedUser) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'active':
      default:
        return <Badge className="bg-success/20 text-success border-success/30">Active</Badge>;
    }
  };

  const getSubscriptionBadge = (user: ManagedUser) => {
    if (user.subscribed) {
      return <Badge className="bg-primary/20 text-primary border-primary/30">Subscribed</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and their permissions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and their permissions</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UsersIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subscribed</p>
                <p className="text-2xl font-bold">{stats.subscribed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-primary" />
            All Users
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="entity_owner">Entity Owner</SelectItem>
                  <SelectItem value="registered_agent">Registered Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.company && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3" />
                              {user.company}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.user_type?.replace('_', ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs capitalize">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.account_status)}</TableCell>
                      <TableCell>{getSubscriptionBadge(user)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenModal(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.account_status === 'suspended' ? (
                              <DropdownMenuItem
                                onClick={() => unsuspendUser(user.user_id)}
                                className="text-success"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleOpenModal(user)}
                                className="text-destructive"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Admin Users Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                Admin Users
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage administrator accounts
              </CardDescription>
            </div>
            <Button
              onClick={() => setCreateAdminModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAdmins ? (
            <Skeleton className="h-32" />
          ) : adminUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No admin users found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{admin.displayName}</p>
                          {admin.isSiteOwner && (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={admin.isSiteOwner ? "bg-amber-500/20 text-amber-600 border-amber-500/30" : "bg-primary/20 text-primary border-primary/30"}>
                          {admin.isSiteOwner ? 'Site Owner' : 'Administrator'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={admin.mfa_enabled ? "bg-success/20 text-success border-success/30" : "bg-amber-500/20 text-amber-500 border-amber-500/30"}>
                          {admin.mfa_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={admin.is_active ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={admin.isSiteOwner}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedAdmin(admin);
                              setEditAdminModalOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedAdmin(admin);
                              setResetPasswordModalOpen(true);
                            }}>
                              <KeyRound className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {admin.is_active ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setEditAdminModalOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setEditAdminModalOpen(true);
                                }}
                                className="text-success"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setDeleteAdminDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management Modal */}
      {selectedUser && (
        <UserManagementModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          userId={selectedUser.user_id}
          userData={{
            email: selectedUser.email,
            first_name: selectedUser.first_name,
            last_name: selectedUser.last_name,
            company: selectedUser.company,
            company_size: selectedUser.company_size,
            plan: selectedUser.plan,
            user_type: selectedUser.user_type,
            account_status: selectedUser.account_status,
            roles: selectedUser.roles,
            subscribed: selectedUser.subscribed,
            subscription_tier: selectedUser.subscription_tier,
            is_trial_active: selectedUser.is_trial_active,
            entities_limit: selectedUser.entities_limit,
            created_at: selectedUser.created_at,
          }}
          onRoleChange={() => refetch()}
          onRefetch={() => refetch()}
        />
      )}

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={createAdminModalOpen}
        onClose={() => setCreateAdminModalOpen(false)}
        onSuccess={() => refetchAdmins()}
      />

      {/* Edit Admin Modal */}
      <EditAdminModal
        isOpen={editAdminModalOpen}
        onClose={() => {
          setEditAdminModalOpen(false);
          setSelectedAdmin(null);
        }}
        onSuccess={() => refetchAdmins()}
        admin={selectedAdmin}
      />

      {/* Delete Admin Dialog */}
      <DeleteAdminDialog
        isOpen={deleteAdminDialogOpen}
        onClose={() => {
          setDeleteAdminDialogOpen(false);
          setSelectedAdmin(null);
        }}
        onSuccess={() => refetchAdmins()}
        admin={selectedAdmin}
      />

      {/* Reset Password Modal */}
      <ResetAdminPasswordModal
        isOpen={resetPasswordModalOpen}
        onClose={() => {
          setResetPasswordModalOpen(false);
          setSelectedAdmin(null);
        }}
        onSuccess={() => refetchAdmins()}
        admin={selectedAdmin}
      />
    </div>
  );
};

export default Users;
