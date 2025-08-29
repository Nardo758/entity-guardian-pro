import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationPreferences } from '@/types/entity';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPreferences = async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no preferences exist, create default ones
      if (!data) {
        const defaultPreferences = {
          user_id: user.id,
          email_notifications: true,
          reminder_days_before: [30, 14, 7, 1],
          notification_types: ['renewal_reminder', 'payment_due', 'compliance_check'],
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs as NotificationPreferences);
      } else {
        setPreferences(data as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data as NotificationPreferences);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update preferences');
      throw error;
    }
  };

  useEffect(() => {
    fetchPreferences();

    // Set up real-time subscription
    const channel = supabase
      .channel('notification-preferences-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_preferences',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchPreferences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
};