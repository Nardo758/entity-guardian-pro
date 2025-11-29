import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ReportConfig } from '@/hooks/useReportConfigs';
import { AdminUser } from '@/hooks/useAdminUsers';

interface ReportConfigFormProps {
  config?: ReportConfig;
  adminUsers: AdminUser[];
  onSubmit: (config: Omit<ReportConfig, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export const ReportConfigForm: React.FC<ReportConfigFormProps> = ({
  config,
  adminUsers,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: config?.name || '',
    schedule_type: config?.schedule_type || 'daily',
    schedule_time: config?.schedule_time || '08:00:00',
    schedule_day: config?.schedule_day || null,
    is_enabled: config?.is_enabled ?? true,
    email_subject: config?.email_subject || 'Security Report',
    email_template: config?.email_template || 'default',
    custom_html: config?.custom_html || null,
    recipient_user_ids: config?.recipient_user_ids || [],
    include_ip_reputation: config?.include_ip_reputation ?? true,
    include_violations: config?.include_violations ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData as any);
  };

  const toggleRecipient = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      recipient_user_ids: prev.recipient_user_ids.includes(userId)
        ? prev.recipient_user_ids.filter(id => id !== userId)
        : [...prev.recipient_user_ids, userId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Report Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Daily Security Report"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="schedule_type">Schedule Type</Label>
            <Select
              value={formData.schedule_type}
              onValueChange={(value: any) => setFormData({ ...formData, schedule_type: value })}
            >
              <SelectTrigger id="schedule_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="manual">Manual Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="schedule_time">Schedule Time (UTC)</Label>
            <Input
              id="schedule_time"
              type="time"
              value={formData.schedule_time.substring(0, 5)}
              onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value + ':00' })}
              required
            />
          </div>
        </div>

        {formData.schedule_type === 'weekly' && (
          <div>
            <Label htmlFor="schedule_day">Day of Week</Label>
            <Select
              value={formData.schedule_day?.toString() || '1'}
              onValueChange={(value) => setFormData({ ...formData, schedule_day: parseInt(value) })}
            >
              <SelectTrigger id="schedule_day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map(day => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="email_subject">Email Subject</Label>
          <Input
            id="email_subject"
            value={formData.email_subject}
            onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
            placeholder="Security Report"
            required
          />
        </div>

        <div>
          <Label>Recipients</Label>
          <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
            {adminUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No admin users available</p>
            ) : (
              adminUsers.map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`recipient-${user.id}`}
                    checked={formData.recipient_user_ids.includes(user.id)}
                    onCheckedChange={() => toggleRecipient(user.id)}
                  />
                  <Label
                    htmlFor={`recipient-${user.id}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {user.displayName}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Report Contents</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="include_ip_reputation"
              checked={formData.include_ip_reputation}
              onCheckedChange={(checked) => setFormData({ ...formData, include_ip_reputation: checked })}
            />
            <Label htmlFor="include_ip_reputation" className="cursor-pointer font-normal">
              Include IP Reputation Data
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="include_violations"
              checked={formData.include_violations}
              onCheckedChange={(checked) => setFormData({ ...formData, include_violations: checked })}
            />
            <Label htmlFor="include_violations" className="cursor-pointer font-normal">
              Include Security Violations
            </Label>
          </div>
        </div>

        <div>
          <Label>Custom HTML Template (Optional)</Label>
          <Textarea
            value={formData.custom_html || ''}
            onChange={(e) => setFormData({ ...formData, custom_html: e.target.value || null })}
            placeholder="Leave blank to use default template"
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use custom HTML to override the default email template
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_enabled"
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
          />
          <Label htmlFor="is_enabled" className="cursor-pointer font-normal">
            Enable Automatic Sending
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {config ? 'Update' : 'Create'} Report
        </Button>
      </div>
    </form>
  );
};
