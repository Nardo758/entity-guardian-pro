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
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-warning-muted via-warning-muted/80 to-warning-muted/60 border border-warning/20 p-6 shadow-modern backdrop-blur-sm animate-fade-up">
      <h3 className="font-bold text-warning mb-4 flex items-center gap-3 text-lg">
        <div className="rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 p-2">
          <Bell className="h-5 w-5" />
        </div>
        Recent Notifications
      </h3>
      <div className="space-y-4">
        {notifications.slice(0, 2).map((notification, index) => (
          <div 
            key={notification.id} 
            className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface/50 backdrop-blur-sm border border-warning/10 hover:border-warning/20 transition-all duration-300"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex-1">
              <div className="font-semibold text-warning mb-2 text-base">
                {notification.title}
              </div>
              <div className="text-sm text-warning/80 leading-relaxed">
                {notification.message}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(notification.id)}
              className="text-warning/70 hover:text-warning hover:bg-warning/10 transition-all duration-300 hover:scale-110"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};