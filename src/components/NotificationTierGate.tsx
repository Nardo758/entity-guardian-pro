import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, MessageSquare, Mail, Lock, Crown } from 'lucide-react';
import { useTierPermissions } from '@/hooks/useTierPermissions';
import { useUpgradePrompt } from '@/components/UpgradePrompt';
import { FeatureBadge } from '@/components/FeatureGate';

interface NotificationTierGateProps {
  preferences: any;
  onPreferenceChange: (key: string, value: any) => void;
}

export const NotificationTierGate: React.FC<NotificationTierGateProps> = ({
  preferences,
  onPreferenceChange
}) => {
  const permissions = useTierPermissions();
  const { showUpgradePrompt, UpgradePromptComponent } = useUpgradePrompt();

  const handleRestrictedToggle = (feature: string, requiredTier: string) => {
    showUpgradePrompt(
      `${feature} Notifications`, 
      requiredTier, 
      `Enable ${feature.toLowerCase()} notifications with the ${requiredTier} plan.`
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Email Notifications - Available to all tiers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <Label htmlFor="email-notifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications || false}
              onCheckedChange={(checked) => onPreferenceChange('email_notifications', checked)}
            />
          </div>

          {/* SMS Notifications - Growth tier and above */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <Label htmlFor="sms-notifications" className="text-sm font-medium">
                  SMS Notifications
                </Label>
                <FeatureBadge feature="SMS Notifications" requiredTier="growth" />
              </div>
              <p className="text-sm text-muted-foreground">
                Receive urgent notifications via text message
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!permissions.canUseSMS && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                id="sms-notifications"
                checked={permissions.canUseSMS && (preferences.sms_notifications || false)}
                disabled={!permissions.canUseSMS}
                onCheckedChange={(checked) => {
                  if (!permissions.canUseSMS) {
                    handleRestrictedToggle('SMS', 'growth');
                  } else {
                    onPreferenceChange('sms_notifications', checked);
                  }
                }}
              />
            </div>
          </div>

          {/* Advanced scheduling - Growth tier and above */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label htmlFor="advanced-scheduling" className="text-sm font-medium">
                  Advanced Scheduling
                </Label>
                <FeatureBadge feature="Advanced Scheduling" requiredTier="growth" />
              </div>
              <p className="text-sm text-muted-foreground">
                Custom reminder schedules and smart timing
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!permissions.canAdvancedScheduling && (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                id="advanced-scheduling"
                checked={permissions.canAdvancedScheduling && (preferences.advanced_scheduling || false)}
                disabled={!permissions.canAdvancedScheduling}
                onCheckedChange={(checked) => {
                  if (!permissions.canAdvancedScheduling) {
                    handleRestrictedToggle('Advanced Scheduling', 'growth');
                  } else {
                    onPreferenceChange('advanced_scheduling', checked);
                  }
                }}
              />
            </div>
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Notification Types</Label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { key: 'renewal_reminder', label: 'Renewal Reminders', icon: Bell, tier: 'starter' },
                { key: 'payment_due', label: 'Payment Due', icon: Bell, tier: 'starter' },
                { key: 'compliance_check', label: 'Compliance Updates', icon: Bell, tier: 'starter' },
                { key: 'entity_changes', label: 'Entity Changes', icon: Bell, tier: 'growth' },
                { key: 'api_alerts', label: 'API Alerts', icon: Bell, tier: 'growth' },
              ].map((type) => {
                const isRestricted = !permissions.canUseSMS && type.tier !== 'starter';
                const isChecked = preferences.notification_types?.includes(type.key) || false;
                
                return (
                  <div key={type.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      <Label htmlFor={type.key} className="text-sm">
                        {type.label}
                      </Label>
                      {type.tier !== 'starter' && (
                        <FeatureBadge feature={type.label} requiredTier={type.tier} />
                      )}
                    </div>
                    <Switch
                      id={type.key}
                      checked={!isRestricted && isChecked}
                      disabled={isRestricted}
                      onCheckedChange={(checked) => {
                        if (isRestricted) {
                          handleRestrictedToggle(type.label, type.tier);
                        } else {
                          const currentTypes = preferences.notification_types || [];
                          const newTypes = checked
                            ? [...currentTypes, type.key]
                            : currentTypes.filter((t: string) => t !== type.key);
                          onPreferenceChange('notification_types', newTypes);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <UpgradePromptComponent />
    </div>
  );
};