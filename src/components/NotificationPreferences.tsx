import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Loader2, Bell, Mail, Calendar, CreditCard, FileCheck, X } from 'lucide-react';

export const NotificationPreferences = () => {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();
  const [reminderDays, setReminderDays] = useState<string>('');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Failed to load notification preferences
          </p>
        </CardContent>
      </Card>
    );
  }

  const notificationTypeOptions = [
    {
      value: 'renewal_reminder',
      label: 'Renewal Reminders',
      description: 'Get notified about upcoming entity renewals',
      icon: Calendar,
    },
    {
      value: 'payment_due',
      label: 'Payment Due Alerts',
      description: 'Alerts when payments are approaching their due date',
      icon: CreditCard,
    },
    {
      value: 'compliance_check',
      label: 'Compliance Checks',
      description: 'Notifications about compliance requirements',
      icon: FileCheck,
    },
  ];

  const handleEmailToggle = async (enabled: boolean) => {
    await updatePreferences({ email_notifications: enabled });
  };

  const handleNotificationTypeToggle = async (type: string, enabled: boolean) => {
    const currentTypes = preferences.notification_types || [];
    const newTypes = enabled
      ? [...currentTypes, type]
      : currentTypes.filter(t => t !== type);
    
    await updatePreferences({ notification_types: newTypes });
  };

  const handleAddReminderDay = async () => {
    const days = parseInt(reminderDays);
    if (isNaN(days) || days < 1 || days > 365) {
      return;
    }

    const currentDays = preferences.reminder_days_before || [];
    if (currentDays.includes(days)) {
      return;
    }

    const newDays = [...currentDays, days].sort((a, b) => b - a);
    await updatePreferences({ reminder_days_before: newDays });
    setReminderDays('');
  };

  const handleRemoveReminderDay = async (dayToRemove: number) => {
    const currentDays = preferences.reminder_days_before || [];
    const newDays = currentDays.filter(day => day !== dayToRemove);
    await updatePreferences({ reminder_days_before: newDays });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Customize how and when you receive notifications about your entities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email-notifications">Email Notifications</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email in addition to in-app alerts
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.email_notifications}
            onCheckedChange={handleEmailToggle}
          />
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <Label>Notification Types</Label>
          <div className="space-y-3">
            {notificationTypeOptions.map((option) => {
              const Icon = option.icon;
              const isEnabled = preferences.notification_types?.includes(option.value) || false;
              
              return (
                <div key={option.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={option.value}
                    checked={isEnabled}
                    onCheckedChange={(checked) => 
                      handleNotificationTypeToggle(option.value, !!checked)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <label
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option.label}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Reminder Days */}
        <div className="space-y-4">
          <Label>Reminder Schedule</Label>
          <p className="text-sm text-muted-foreground">
            Set how many days before due dates you want to receive reminders
          </p>
          
          {/* Current Reminder Days */}
          <div className="flex flex-wrap gap-2">
            {preferences.reminder_days_before?.sort((a, b) => b - a).map((days) => (
              <Badge key={days} variant="secondary" className="flex items-center gap-1">
                {days} day{days !== 1 ? 's' : ''} before
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveReminderDay(days)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Add New Reminder Day */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Days before due date"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              min="1"
              max="365"
              className="w-48"
            />
            <Button 
              onClick={handleAddReminderDay}
              disabled={!reminderDays || isNaN(parseInt(reminderDays))}
            >
              Add Reminder
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};