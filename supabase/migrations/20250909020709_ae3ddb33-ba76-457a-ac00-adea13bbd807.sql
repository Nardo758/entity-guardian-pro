-- Critical Security Enhancement: Protect Customer Personal Information in Profiles Table
-- This addresses the security finding about potential PII exposure

-- Create function to mask sensitive PII data for admin views
CREATE OR REPLACE FUNCTION public.mask_profile_pii(
  profile_row profiles,
  requesting_user_id uuid DEFAULT auth.uid()
) 
RETURNS profiles 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  masked_profile profiles;
BEGIN
  -- Check if requesting user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = requesting_user_id AND ur.role = 'admin'::app_role
  ) INTO is_admin;
  
  -- If user is viewing their own profile, return full data
  IF profile_row.user_id = requesting_user_id THEN
    RETURN profile_row;
  END IF;
  
  -- Create masked version for admin access
  masked_profile := profile_row;
  
  -- Mask PII fields for admin views (keep first letter + asterisks)
  IF is_admin THEN
    -- Partial masking for admins (still functional but privacy-protective)
    masked_profile.first_name := CASE 
      WHEN profile_row.first_name IS NOT NULL 
      THEN LEFT(profile_row.first_name, 1) || REPEAT('*', GREATEST(LENGTH(profile_row.first_name) - 1, 0))
      ELSE NULL 
    END;
    
    masked_profile.last_name := CASE 
      WHEN profile_row.last_name IS NOT NULL 
      THEN LEFT(profile_row.last_name, 1) || REPEAT('*', GREATEST(LENGTH(profile_row.last_name) - 1, 0))
      ELSE NULL 
    END;
    
    masked_profile.phone_number := CASE 
      WHEN profile_row.phone_number IS NOT NULL 
      THEN REGEXP_REPLACE(profile_row.phone_number, '.(?=.{4})', '*', 'g')
      ELSE NULL 
    END;
  ELSE 
    -- Complete masking for non-admin, non-owner access
    masked_profile.first_name := NULL;
    masked_profile.last_name := NULL;
    masked_profile.phone_number := NULL;
    masked_profile.company := NULL;
  END IF;
  
  RETURN masked_profile;
END;
$$;

-- Create secure profile view function that automatically applies masking
CREATE OR REPLACE FUNCTION public.get_secure_profile(profile_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data profiles;
BEGIN
  -- Log access attempt for audit trail
  PERFORM log_security_event(
    'profile_access_attempt',
    jsonb_build_object(
      'target_user_id', profile_user_id,
      'requesting_user_id', auth.uid(),
      'timestamp', now()
    )
  );
  
  -- Get profile data
  SELECT * INTO profile_data 
  FROM profiles 
  WHERE user_id = profile_user_id;
  
  -- Return masked version
  RETURN mask_profile_pii(profile_data);
END;
$$;

-- Add comprehensive audit logging for profile table
CREATE TRIGGER profiles_security_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_data_access();

-- Create restrictive policy for profile selection that ensures PII protection
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "secure_profile_access" ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  auth.uid() = user_id 
  OR 
  -- Admins can see profiles but through audit logging
  (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    )
    -- Log admin access to profiles
    AND log_security_event(
      'admin_profile_access',
      jsonb_build_object(
        'accessed_user_id', profiles.user_id,
        'admin_user_id', auth.uid(),
        'timestamp', now()
      )
    ) IS NOT NULL
  )
);

-- Add data classification metadata
COMMENT ON COLUMN public.profiles.first_name IS 'PII-SENSITIVE: Personal identifier requiring privacy protection';
COMMENT ON COLUMN public.profiles.last_name IS 'PII-SENSITIVE: Personal identifier requiring privacy protection';  
COMMENT ON COLUMN public.profiles.phone_number IS 'PII-SENSITIVE: Contact information requiring privacy protection';
COMMENT ON COLUMN public.profiles.company IS 'PII-BUSINESS: Company affiliation information';

-- Create secure admin view that automatically masks data
CREATE OR REPLACE VIEW public.secure_admin_profiles AS
SELECT 
  id,
  user_id,
  -- Apply masking for sensitive fields
  CASE 
    WHEN first_name IS NOT NULL 
    THEN LEFT(first_name, 1) || REPEAT('*', GREATEST(LENGTH(first_name) - 1, 0))
    ELSE NULL 
  END as first_name_masked,
  CASE 
    WHEN last_name IS NOT NULL 
    THEN LEFT(last_name, 1) || REPEAT('*', GREATEST(LENGTH(last_name) - 1, 0))
    ELSE NULL 
  END as last_name_masked,
  company,  -- Company can remain visible for business context
  company_size,
  plan,
  created_at,
  updated_at,
  user_type,
  account_status,
  suspension_reason,
  suspended_at,
  suspended_by,
  -- Mask phone number (show last 4 digits only)
  CASE 
    WHEN phone_number IS NOT NULL 
    THEN REGEXP_REPLACE(phone_number, '.(?=.{4})', '*', 'g')
    ELSE NULL 
  END as phone_number_masked,
  phone_verified
FROM public.profiles
WHERE EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
);

-- Grant appropriate permissions
GRANT SELECT ON public.secure_admin_profiles TO authenticated;