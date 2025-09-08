-- Create performance index for scheduled notifications processing (simplified)
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for 
  ON public.scheduled_notifications(scheduled_for);

-- Create index for user notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id 
  ON public.scheduled_notifications(user_id);