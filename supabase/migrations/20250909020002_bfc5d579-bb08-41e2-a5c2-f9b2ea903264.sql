-- Security Fix: Remove public access policies only
-- Remove the public access policies that were identified as security risks

DROP POLICY IF EXISTS "Users can view active referral programs" ON public.referral_programs;
DROP POLICY IF EXISTS "Authenticated users can view active referral programs" ON public.referral_programs;
DROP POLICY IF EXISTS "Users can view active viral content" ON public.viral_content;

-- Add security logging function for audit trail
CREATE OR REPLACE FUNCTION public.log_admin_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive admin data
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'admin_data_modification',
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;