-- Critical Security Fix: Remove email-based access from subscribers RLS policy
-- This prevents potential data exposure from email enumeration attacks

DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Create new secure policy that only allows access via user_id
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

-- Add security logging for this critical table
CREATE TRIGGER subscribers_security_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_data_access();