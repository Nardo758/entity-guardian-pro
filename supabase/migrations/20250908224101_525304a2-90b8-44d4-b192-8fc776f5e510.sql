-- Create performance index for scheduled notifications processing
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for 
  ON public.scheduled_notifications(scheduled_for) 
  WHERE sent_at IS NULL;