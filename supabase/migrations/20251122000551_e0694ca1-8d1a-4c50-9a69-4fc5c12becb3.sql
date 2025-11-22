-- Add fields to track trial reminder emails sent
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS trial_reminder_3_days_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS trial_reminder_1_day_sent BOOLEAN DEFAULT FALSE;

-- Create index for efficient querying of trial expiration dates
CREATE INDEX IF NOT EXISTS idx_subscribers_trial_reminders 
ON public.subscribers(trial_start, is_trial_active, trial_reminder_3_days_sent, trial_reminder_1_day_sent);