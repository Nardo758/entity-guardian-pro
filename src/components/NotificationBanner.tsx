import React from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notification } from '@/types/entity';

interface NotificationBannerProps {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ 
  notifications, 
  onDismiss 
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl bg-warning-muted border border-warning/20 p-6">
      <h3 className="font-semibold text-warning mb-4 flex items-center gap-2">
        <Bell className="h-4 w-4" />
        Recent Notifications
      </h3>
      <div className="space-y-3">
        {notifications.slice(0, 2).map((notification) => (
          <div key={notification.id} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-warning mb-1">
                {notification.title}
              </div>
              <div className="text-sm text-warning/80">
                {notification.message}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(notification.id)}
              className="text-warning/70 hover:text-warning hover:bg-warning/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};