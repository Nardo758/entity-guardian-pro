import { useState, useEffect } from 'react';
import { X, Bell, Mail, Calendar, AlertCircle, CheckCircle, Clock, Check } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

export const EnhancedNotificationBanner = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string, emailSent: boolean) => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case 'payment_due':
        return <AlertCircle className={`${iconClass} text-orange-500`} />;
      case 'renewal_reminder':
        return <Calendar className={`${iconClass} text-blue-500`} />;
      case 'compliance_check':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_due':
        return 'bg-orange-50 border-orange-200';
      case 'renewal_reminder':
        return 'bg-blue-50 border-blue-200';
      case 'compliance_check':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  if (loading) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4 mr-2" />
          Notifications
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-2 px-1 py-0 text-xs min-w-[1.25rem] h-5"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-96 p-0" align="end">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
        
        <Separator />
        
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg mb-2 border transition-colors cursor-pointer ${
                    notification.read 
                      ? 'bg-white border-gray-100' 
                      : getNotificationColor(notification.type)
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getNotificationIcon(notification.type, notification.email_sent)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          
                          {notification.notification_type === 'both' || notification.notification_type === 'email' ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className={notification.email_sent ? 'text-green-600' : 'text-orange-600'}>
                                {notification.email_sent ? 'Sent' : 'Pending'}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};