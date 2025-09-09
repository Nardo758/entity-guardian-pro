-- Security Fix: Remove public access to referral programs
-- Only authenticated users with admin role should access referral programs
DROP POLICY IF EXISTS "Users can view active referral programs" ON public.referral_programs;
DROP POLICY IF EXISTS "Authenticated users can view active referral programs" ON public.referral_programs;

-- Create new restricted policy for referral programs
CREATE POLICY "Admin only referral programs access" 
ON public.referral_programs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Security Fix: Remove public access to viral content
-- Only admins should access viral content management
DROP POLICY IF EXISTS "Users can view active viral content" ON public.viral_content;

-- Ensure only admin access for viral content (keep existing admin policies)
-- The existing "Admins can manage viral content" and "Only admins can manage viral content" policies are sufficient

-- Add additional security logging for admin operations on sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive tables for audit purposes
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-000000000000'::uuid),
    'sensitive_data_modification',
    1,
    'security_audit',
    CURRENT_DATE,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now(),
      'user_id', auth.uid()
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add security audit triggers for sensitive tables (INSERT, UPDATE, DELETE only)
CREATE TRIGGER referral_programs_security_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.referral_programs
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();

CREATE TRIGGER viral_content_security_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.viral_content
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_access();