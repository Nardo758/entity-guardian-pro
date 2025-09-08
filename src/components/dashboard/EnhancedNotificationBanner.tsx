import React from 'react';
import { X, Bell, UserCheck, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    agent_email?: string;
    entity_name?: string;
    invitation_status?: string;
    expires_at?: string;
  };
}

interface EnhancedNotificationBannerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const EnhancedNotificationBanner: React.FC<EnhancedNotificationBannerProps> = ({
  notifications,
  onDismiss
}) => {
  if (notifications.length === 0) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'agent_invitation_accepted':
        return <UserCheck className="h-4 w-4 text-success" />;
      case 'agent_invitation_pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'renewal_reminder':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'payment_due':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'compliance_check':
        return <CheckCircle className="h-4 w-4 text-info" />;
      default:
        return <Bell className="h-4 w-4 text-info" />;
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'agent_invitation_accepted':
        return 'default';
      case 'agent_invitation_pending':
        return 'default';
      case 'renewal_reminder':
        return 'destructive';
      case 'payment_due':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatNotificationMessage = (notification: Notification) => {
    const { metadata } = notification;
    
    switch (notification.type) {
      case 'agent_invitation_accepted':
        return `Agent ${metadata?.agent_email} has accepted your invitation for ${metadata?.entity_name}`;
      case 'agent_invitation_pending':
        return `Invitation to ${metadata?.agent_email} is still pending for ${metadata?.entity_name}`;
      case 'renewal_reminder':
        return `${metadata?.entity_name} renewal is due soon`;
      case 'payment_due':
        return `Payment due for ${metadata?.entity_name}`;
      default:
        return notification.message;
    }
  };

  return (
    <div className="space-y-3">
      {notifications.slice(0, 3).map((notification) => (
        <Alert 
          key={notification.id} 
          variant={getNotificationVariant(notification.type)}
          className="relative border-l-4"
        >
          <div className="flex items-start gap-3">
            {getNotificationIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {notification.type.replace(/_/g, ' ')}
                </Badge>
              </div>
              <AlertDescription className="text-sm">
                {formatNotificationMessage(notification)}
              </AlertDescription>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(notification.id)}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
      
      {notifications.length > 3 && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            +{notifications.length - 3} more notifications
          </Badge>
        </div>
      )}
    </div>
  );
};

export default EnhancedNotificationBanner;