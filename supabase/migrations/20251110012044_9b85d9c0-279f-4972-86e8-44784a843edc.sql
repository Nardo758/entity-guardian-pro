-- Update log_admin_action function to send email alerts for critical events
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type TEXT,
  p_action_category TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_audit_id UUID;
  v_admin_user_id UUID;
  v_ip_address TEXT;
  v_user_agent TEXT;
  v_target_email TEXT;
BEGIN
  -- Get current admin user
  v_admin_user_id := auth.uid();
  
  -- Get IP and user agent from request headers
  BEGIN
    v_ip_address := current_setting('request.headers', true)::jsonb->>'x-real-ip';
    v_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip_address := NULL;
    v_user_agent := NULL;
  END;
  
  -- Get target user email if target_user_id provided
  IF p_target_user_id IS NOT NULL THEN
    SELECT email INTO v_target_email
    FROM auth.users
    WHERE id = p_target_user_id;
  END IF;
  
  -- Insert audit log entry
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    action_category,
    target_user_id,
    severity,
    description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    v_admin_user_id,
    p_action_type,
    p_action_category,
    p_target_user_id,
    p_severity::public.audit_severity,
    p_description,
    p_metadata,
    v_ip_address,
    v_user_agent
  )
  RETURNING id INTO v_audit_id;
  
  -- Send email alert for critical and warning events
  IF p_severity IN ('critical', 'warning') THEN
    BEGIN
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-security-alert',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
        ),
        body := jsonb_build_object(
          'actionType', p_action_type,
          'actionCategory', p_action_category,
          'severity', p_severity,
          'description', p_description,
          'targetUserEmail', v_target_email,
          'ipAddress', v_ip_address,
          'metadata', p_metadata
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the audit log insert
      RAISE WARNING 'Failed to send security alert email: %', SQLERRM;
    END;
  END IF;
  
  RETURN v_audit_id;
END;
$$;

-- Add app settings for edge function URL (if not already set)
DO $$
BEGIN
  PERFORM set_config('app.settings.supabase_url', 'https://wcuxqopfcgivypbiynjp.supabase.co', false);
  PERFORM set_config('app.settings.supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdXhxb3BmY2dpdnlwYml5bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNDI1NzMsImV4cCI6MjA3MTkxODU3M30.-RkbzPY_FZVd9qShJxi959LLSqWXYI7Mkqk1DqJVt6o', false);
END $$;

-- Update trigger functions to use new log_admin_action with email alerts
CREATE OR REPLACE FUNCTION public.log_role_changes_to_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_admin_action(
      'role_assigned',
      'access_control',
      NEW.user_id,
      CASE WHEN NEW.role = 'admin' THEN 'warning' ELSE 'info' END,
      format('Role "%s" assigned to user', NEW.role),
      jsonb_build_object(
        'role', NEW.role,
        'assigned_by', COALESCE(NEW.created_by, auth.uid())
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_admin_action(
      'role_revoked',
      'access_control',
      OLD.user_id,
      CASE WHEN OLD.role = 'admin' THEN 'warning' ELSE 'info' END,
      format('Role "%s" revoked from user', OLD.role),
      jsonb_build_object(
        'role', OLD.role,
        'revoked_by', auth.uid()
      )
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Function to log failed admin login attempts
CREATE OR REPLACE FUNCTION public.log_failed_admin_login(
  p_email TEXT,
  p_reason TEXT DEFAULT 'invalid_credentials',
  p_ip_address TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user exists and is admin
  SELECT u.id, EXISTS(
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'admin'
  )
  INTO v_user_id, v_is_admin
  FROM auth.users u
  WHERE u.email = p_email;
  
  -- Only log and alert for admin accounts
  IF v_is_admin THEN
    PERFORM public.log_admin_action(
      'failed_admin_login',
      'authentication',
      v_user_id,
      'critical',
      format('Failed login attempt for admin account: %s', p_email),
      jsonb_build_object(
        'email', p_email,
        'reason', p_reason,
        'ip_address', p_ip_address,
        'attempt_time', now()
      )
    );
  END IF;
END;
$$;