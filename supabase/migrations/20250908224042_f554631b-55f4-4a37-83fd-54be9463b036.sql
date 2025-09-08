-- Add scheduled notifications table for notification service
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for scheduled notifications
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled notifications
CREATE POLICY "Users can manage their own scheduled notifications" ON public.scheduled_notifications
  FOR ALL USING (auth.uid() = user_id);