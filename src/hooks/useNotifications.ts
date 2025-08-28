import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
      setNotifications((data || []) as Notification[]);
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

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      );
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

  return {
    notifications,
    loading,
    markAsRead,
    refetch: fetchNotifications,
  };
};