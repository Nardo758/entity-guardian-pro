import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Mail, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PERMISSION_OPTIONS = [
  { id: 'all', label: 'Full Access', description: 'Complete admin privileges' },
  { id: 'users', label: 'User Management', description: 'Manage user accounts' },
  { id: 'billing', label: 'Billing', description: 'View and manage billing' },
  { id: 'support', label: 'Support', description: 'Handle support tickets' },
  { id: 'analytics', label: 'Analytics', description: 'View analytics data' },
  { id: 'settings', label: 'Settings', description: 'Modify system settings' },
];

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'invite' | 'create'>('invite');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<string>('all');

  const resetForm = () => {
    setEmail('');
    setDisplayName('');
    setPassword('');
    setConfirmPassword('');
    setSelectedPermission('all');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !displayName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (activeTab === 'create') {
      if (!password) {
        toast.error('Password is required');
        return;
      }
      if (password.length < 12) {
        toast.error('Password must be at least 12 characters');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const sessionToken = sessionStorage.getItem('admin_session_token');
      
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          action: activeTab,
          email,
          display_name: displayName,
          password: activeTab === 'create' ? password : undefined,
          permissions: [selectedPermission],
        },
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        activeTab === 'invite' 
          ? 'Admin invitation sent successfully' 
          : 'Admin account created successfully'
      );
      
      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Admin</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new administrator account
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'invite' | 'create')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">
              <Mail className="h-4 w-4 mr-2" />
              Send Invitation
            </TabsTrigger>
            <TabsTrigger value="create">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Directly
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">Display Name *</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>

            <TabsContent value="invite" className="mt-0 p-0">
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                A temporary password will be generated and sent to the user's email. 
                They will be required to set up MFA on first login.
              </p>
            </TabsContent>

            <TabsContent value="create" className="mt-0 p-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 12 characters"
                    className="pr-10"
                    minLength={12}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </TabsContent>

            <div className="space-y-3">
              <Label className="text-foreground">Permissions</Label>
              <RadioGroup 
                value={selectedPermission} 
                onValueChange={setSelectedPermission}
                className="grid grid-cols-2 gap-3"
              >
                {PERMISSION_OPTIONS.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-3">
                    <RadioGroupItem 
                      value={perm.id} 
                      id={perm.id}
                      className="mt-0.5"
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label 
                        htmlFor={perm.id} 
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        {perm.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {activeTab === 'invite' ? 'Send Invitation' : 'Create Admin'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
