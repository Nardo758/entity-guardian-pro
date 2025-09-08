-- Fix the security warning about function search paths
-- Update the audit_role_changes function to have immutable search_path
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log role assignment/changes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.analytics_data (
      user_id,
      metric_name,
      metric_value,
      metric_type,
      metric_date,
      metadata
    ) VALUES (
      COALESCE(NEW.created_by, auth.uid()),
      'role_assigned',
      1,
      'security_audit',
      CURRENT_DATE,
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role_assigned', NEW.role,
        'assigned_by', COALESCE(NEW.created_by, auth.uid()),
        'timestamp', now()
      )
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.analytics_data (
      user_id,
      metric_name,
      metric_value,
      metric_type,
      metric_date,
      metadata
    ) VALUES (
      auth.uid(),
      'role_revoked',
      1,
      'security_audit',
      CURRENT_DATE,
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'role_revoked', OLD.role,
        'revoked_by', auth.uid(),
        'timestamp', now()
      )
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$function$;