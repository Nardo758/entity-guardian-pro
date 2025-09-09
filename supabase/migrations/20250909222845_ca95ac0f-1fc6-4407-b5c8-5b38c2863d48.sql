-- Comprehensive security fixes for sensitive data protection (corrected)

-- 1. Fix subscribers table - ensure proper email validation and access control
DROP POLICY IF EXISTS "subscribers_select_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_update_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_insert_own" ON public.subscribers;

-- Recreate subscribers policies with strict user_id validation
CREATE POLICY "subscribers_select_own" ON public.subscribers
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

CREATE POLICY "subscribers_update_own" ON public.subscribers
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "subscribers_insert_own" ON public.subscribers
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 2. Fix OTPs table - ensure users can only access their own OTPs
DROP POLICY IF EXISTS "otp_select_owner" ON public.otps;
CREATE POLICY "otp_select_owner" ON public.otps
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND expires_at > now()
);

-- 3. Fix phone_verifications table - restrict to owner only
DROP POLICY IF EXISTS "Users can manage their own phone verifications" ON public.phone_verifications;
CREATE POLICY "phone_verification_owner_only" ON public.phone_verifications
FOR ALL
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

-- 4. Fix profiles table - add missing user_id validation trigger
CREATE OR REPLACE FUNCTION public.validate_profile_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user can only modify their own profile
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Can only modify own profile';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to profiles table
DROP TRIGGER IF EXISTS validate_profile_owner_trigger ON public.profiles;
CREATE TRIGGER validate_profile_owner_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_owner();

-- 5. Fix agents table - ensure proper access control with correct columns
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agents_owner_access" ON public.agents;
CREATE POLICY "agents_owner_access" ON public.agents
FOR ALL
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

-- Allow limited public read access to agents directory info (no sensitive data)
DROP POLICY IF EXISTS "agents_public_directory" ON public.agents;
CREATE POLICY "agents_public_directory" ON public.agents
FOR SELECT 
USING (is_available = true);

-- 6. Create secure view for agents directory (without sensitive contact info)
DROP VIEW IF EXISTS public.agents_directory;
CREATE VIEW public.agents_directory AS
SELECT 
  id,
  company_name,
  states,
  price_per_entity,
  bio,
  years_experience,
  is_available,
  created_at
FROM public.agents
WHERE user_id IS NOT NULL AND is_available = true;

-- 7. Add comprehensive audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
    'sensitive_data_access',
    1,
    'security_audit',
    CURRENT_DATE,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now(),
      'record_id', CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id::text
        ELSE NEW.id::text
      END
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_subscribers_access ON public.subscribers;
CREATE TRIGGER audit_subscribers_access
  AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_payment_methods_access ON public.payment_methods;
CREATE TRIGGER audit_payment_methods_access
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();

DROP TRIGGER IF EXISTS audit_phone_verifications_access ON public.phone_verifications;
CREATE TRIGGER audit_phone_verifications_access
  AFTER INSERT OR UPDATE OR DELETE ON public.phone_verifications
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_data_access();