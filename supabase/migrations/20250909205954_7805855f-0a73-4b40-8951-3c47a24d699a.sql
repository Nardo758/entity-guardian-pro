-- Fix security vulnerabilities in subscribers table
-- 1. Make user_id non-nullable for better security
ALTER TABLE public.subscribers ALTER COLUMN user_id SET NOT NULL;

-- 2. Drop existing overlapping RLS policies to avoid confusion
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "admin_access_all_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- 3. Create secure, clear RLS policies
-- Users can only view their own subscription data
CREATE POLICY "subscribers_select_own" ON public.subscribers
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own subscription data
CREATE POLICY "subscribers_insert_own" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscription data
CREATE POLICY "subscribers_update_own" ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can delete their own subscription data
CREATE POLICY "subscribers_delete_own" ON public.subscribers
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all subscriber data but with audit logging
CREATE POLICY "subscribers_admin_access" ON public.subscribers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- 4. Add audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_subscriber_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to subscriber data for security monitoring
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'subscriber_data_access',
    1,
    'security_audit',
    CURRENT_DATE,
    jsonb_build_object(
      'action', TG_OP,
      'table', 'subscribers',
      'timestamp', now(),
      'target_user_id', CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.user_id::text
        ELSE NEW.user_id::text
      END,
      'is_admin', EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
      )
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for audit logging
CREATE TRIGGER subscribers_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.audit_subscriber_access();

-- 5. Create function to safely retrieve subscriber data with masking for admins
CREATE OR REPLACE FUNCTION public.get_secure_subscriber_data(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  email text,
  stripe_customer_id text,
  subscribed boolean,
  subscription_tier text,
  subscription_end timestamptz,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
DECLARE
  is_admin boolean;
  is_own_data boolean;
BEGIN
  -- Check if requesting user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ) INTO is_admin;
  
  -- Check if user is requesting their own data
  SELECT auth.uid() = target_user_id INTO is_own_data;
  
  -- Only allow access if user owns the data or is admin
  IF NOT (is_own_data OR is_admin) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;
  
  -- Log the access attempt
  PERFORM public.log_security_event(
    'subscriber_data_request',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'is_admin_access', is_admin,
      'is_own_data', is_own_data
    )
  );
  
  -- Return data with appropriate masking for admin access
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    CASE 
      WHEN is_own_data THEN s.email
      WHEN is_admin THEN 
        LEFT(s.email, POSITION('@' IN s.email)) || '***@' || 
        SPLIT_PART(s.email, '@', 2)
      ELSE NULL
    END as email,
    CASE 
      WHEN is_own_data THEN s.stripe_customer_id
      WHEN is_admin THEN 'cus_***' || RIGHT(s.stripe_customer_id, 4)
      ELSE NULL
    END as stripe_customer_id,
    s.subscribed,
    s.subscription_tier,
    s.subscription_end,
    s.created_at,
    s.updated_at
  FROM public.subscribers s
  WHERE s.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Add constraint to ensure email matches authenticated user for inserts
CREATE OR REPLACE FUNCTION public.validate_subscriber_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the email matches the authenticated user's email
  IF NEW.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Email must match authenticated user email';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_subscriber_email_trigger
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.validate_subscriber_email();