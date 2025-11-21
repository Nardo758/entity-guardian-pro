-- Add trial tracking fields to subscribers table
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS trial_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_trial_active boolean DEFAULT true;

-- Update existing users to have trial started from their creation date
UPDATE public.subscribers
SET trial_start = created_at,
    is_trial_active = CASE 
      WHEN subscription_tier IS NULL OR subscription_tier = 'starter' THEN true
      ELSE false
    END
WHERE trial_start IS NULL;

-- Create function to check and update expired trials
CREATE OR REPLACE FUNCTION public.check_trial_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If trial is active and has expired, set to inactive
  IF NEW.is_trial_active = true 
     AND NEW.trial_start IS NOT NULL 
     AND NOW() > (NEW.trial_start + INTERVAL '14 days') THEN
    NEW.is_trial_active := false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to auto-check trial expiration on subscriber updates
DROP TRIGGER IF EXISTS check_trial_expiration_trigger ON public.subscribers;
CREATE TRIGGER check_trial_expiration_trigger
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trial_expiration();

-- Add index for trial queries
CREATE INDEX IF NOT EXISTS idx_subscribers_trial_active ON public.subscribers(is_trial_active, trial_start);