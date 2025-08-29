import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const notificationData = (data || []) as Notification[];
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => {
        const updated = prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        );
        setUnreadCount(updated.filter(n => !n.read).length);
        return updated;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
      throw error;
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const createNotification = async (
    type: string, 
    title: string, 
    message: string,
    entityId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          entity_id: entityId,
          type,
          notification_type: 'in_app',
          title,
          message,
          timestamp: new Date().toISOString(),
          read: false,
          email_sent: false,
          retry_count: 0,
          metadata: metadata || {}
        });

      if (error) throw error;
      
      // Refetch to update the list
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Failed to create notification');
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications,
  };
};