import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CreditCard, 
  User,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { ManagedSubscription } from '@/hooks/useAdminBillingManagement';
import { format } from 'date-fns';

interface SubscriptionManagementModalProps {
  subscription: ManagedSubscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (subscriberId: string, updates: Record<string, any>) => void;
  onCancel: (subscriberId: string) => void;
  isUpdating: boolean;
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  subscription,
  open,
  onOpenChange,
  onUpdate,
  onCancel,
  isUpdating,
}) => {
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');
  const [entitiesLimit, setEntitiesLimit] = useState('');
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);

  useEffect(() => {
    if (subscription) {
      setTier(subscription.subscription_tier || 'starter');
      setStatus(subscription.subscription_status || 'active');
      setEntitiesLimit(subscription.entities_limit?.toString() || '4');
      setIsTrialActive(subscription.is_trial_active || false);
      setCancelAtPeriodEnd(subscription.cancel_at_period_end || false);
    }
  }, [subscription]);

  if (!subscription) return null;

  const handleSave = () => {
    onUpdate(subscription.id, {
      subscription_tier: tier,
      subscription_status: status,
      entities_limit: parseInt(entitiesLimit) || 4,
      is_trial_active: isTrialActive,
      cancel_at_period_end: cancelAtPeriodEnd,
    });
  };

  const getStatusIcon = () => {
    if (subscription.cancel_at_period_end) {
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    }
    if (subscription.subscribed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (subscription.is_trial_active) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    return <XCircle className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (subscription.cancel_at_period_end) return 'Canceling';
    if (subscription.subscribed) return 'Active';
    if (subscription.is_trial_active) return 'Trial';
    return 'Inactive';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription>
            View and manage subscription details.
          </DialogDescription>
        </DialogHeader>

        {/* Subscriber Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Subscriber Information</h4>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant={subscription.subscribed ? 'default' : 'secondary'}>
                {getStatusText()}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{subscription.owner_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{subscription.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {format(new Date(subscription.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            {subscription.stripe_customer_id && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Stripe ID:</span>
                <span className="font-mono text-xs">{subscription.stripe_customer_id.slice(0, 18)}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Period Info */}
        {(subscription.current_period_start || subscription.trial_start) && (
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Billing Period</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {subscription.is_trial_active && subscription.trial_end && (
                <>
                  <div>
                    <span className="text-muted-foreground">Trial Started:</span>
                    <p className="font-medium">
                      {subscription.trial_start ? format(new Date(subscription.trial_start), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trial Ends:</span>
                    <p className="font-medium">
                      {format(new Date(subscription.trial_end), 'MMM d, yyyy')}
                    </p>
                  </div>
                </>
              )}
              {subscription.current_period_start && (
                <>
                  <div>
                    <span className="text-muted-foreground">Period Start:</span>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_start), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Period End:</span>
                    <p className="font-medium">
                      {subscription.current_period_end 
                        ? format(new Date(subscription.current_period_end), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Editable Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subscription Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entitiesLimit">Entities Limit</Label>
            <Input
              id="entitiesLimit"
              type="number"
              min="1"
              value={entitiesLimit}
              onChange={(e) => setEntitiesLimit(e.target.value)}
              placeholder="4"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Trial Active</Label>
              <p className="text-xs text-muted-foreground">User is currently on trial</p>
            </div>
            <Switch checked={isTrialActive} onCheckedChange={setIsTrialActive} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Cancel at Period End</Label>
              <p className="text-xs text-muted-foreground">Subscription will cancel at the end of the billing period</p>
            </div>
            <Switch checked={cancelAtPeriodEnd} onCheckedChange={setCancelAtPeriodEnd} />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!subscription.cancel_at_period_end && subscription.subscribed && (
            <Button
              variant="destructive"
              onClick={() => onCancel(subscription.id)}
              className="sm:mr-auto"
            >
              Cancel Subscription
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionManagementModal;
