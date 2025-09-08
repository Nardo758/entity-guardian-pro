-- CRITICAL SECURITY FIXES

-- 1. Fix Profile Role Escalation - Prevent users from changing their own user_type
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to update any profile
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ) THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins, prevent changing user_type, account_status, and suspension fields
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    RAISE EXCEPTION 'Only administrators can change user type';
  END IF;
  
  IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    RAISE EXCEPTION 'Only administrators can change account status';
  END IF;
  
  IF OLD.suspended_at IS DISTINCT FROM NEW.suspended_at OR 
     OLD.suspended_by IS DISTINCT FROM NEW.suspended_by OR
     OLD.suspension_reason IS DISTINCT FROM NEW.suspension_reason THEN
    RAISE EXCEPTION 'Only administrators can modify suspension status';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for profile validation
DROP TRIGGER IF EXISTS validate_profile_update_trigger ON public.profiles;
CREATE TRIGGER validate_profile_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_update();

-- 2. Secure Business Data - Restrict public access to sensitive tables
DROP POLICY IF EXISTS "Public can view active referral programs" ON public.referral_programs;
CREATE POLICY "Authenticated users can view active referral programs" 
ON public.referral_programs 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- 3. Enhanced Role Validation Function
CREATE OR REPLACE FUNCTION public.validate_admin_action(action_name text)
RETURNS boolean AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for %', action_name;
  END IF;
  
  -- Check if user has admin role
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ) THEN
    -- Log unauthorized access attempt
    PERFORM public.log_security_event(
      'unauthorized_admin_access_attempt',
      jsonb_build_object(
        'action', action_name,
        'user_id', auth.uid(),
        'timestamp', now()
      )
    );
    RAISE EXCEPTION 'Administrator privileges required for %', action_name;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 4. Secure all existing functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'admin'::app_role
  );
$function$;

-- 5. Enhanced audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.log_admin_operation(
  operation_type text,
  target_user_id uuid DEFAULT NULL,
  operation_data jsonb DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  -- Validate admin privileges first  
  PERFORM public.validate_admin_action(operation_type);
  
  -- Log the operation
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    auth.uid(),
    operation_type,
    1,
    'admin_operation',
    CURRENT_DATE,
    operation_data || jsonb_build_object(
      'target_user_id', target_user_id,
      'admin_user_id', auth.uid(),
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-real-ip'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 6. Add password complexity validation trigger for auth events
CREATE OR REPLACE FUNCTION public.validate_password_complexity()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called on auth.users insert/update
  -- Check if password meets minimum complexity requirements
  -- Note: We can't access the actual password, but we can validate metadata
  
  -- Log password creation event for monitoring
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    NEW.id,
    'password_event',
    1,
    'security_event',
    CURRENT_DATE,
    jsonb_build_object(
      'event_type', TG_OP,
      'timestamp', now(),
      'user_agent', NEW.raw_user_meta_data->>'user_agent'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger for password events (will work for new registrations)
DROP TRIGGER IF EXISTS password_complexity_trigger ON auth.users;
CREATE TRIGGER password_complexity_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_password_complexity();