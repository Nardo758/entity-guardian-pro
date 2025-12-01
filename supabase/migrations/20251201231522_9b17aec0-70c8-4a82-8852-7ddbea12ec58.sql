-- Drop the broken trigger that's preventing subscriber updates
DROP TRIGGER IF EXISTS log_subscriber_changes ON public.subscribers;

-- Recreate the function with correct column names matching subscription_history table
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier OR
    OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
  ) THEN
    INSERT INTO subscription_history (
      user_id,
      subscription_tier,
      billing_cycle,
      status,
      started_at,
      stripe_subscription_id,
      reason
    )
    VALUES (
      NEW.user_id,
      NEW.subscription_tier,
      COALESCE(NEW.billing_cycle, 'monthly'),
      COALESCE(NEW.subscription_status, 'active'),
      now(),
      NEW.stripe_subscription_id,
      'subscription_change'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER log_subscriber_changes
AFTER UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION log_subscription_change();