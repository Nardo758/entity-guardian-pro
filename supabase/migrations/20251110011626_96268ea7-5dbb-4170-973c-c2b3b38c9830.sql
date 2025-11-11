-- Create comprehensive admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL, -- 'user_management', 'security', 'mfa', 'system', 'role_management'
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action_type ON public.admin_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_category ON public.admin_audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_severity ON public.admin_audit_log(severity);

-- Function to log admin actions
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
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    action_category,
    target_user_id,
    severity,
    description,
    metadata
  )
  VALUES (
    auth.uid(),
    p_action_type,
    p_action_category,
    p_target_user_id,
    p_severity,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Trigger to log role changes
CREATE OR REPLACE FUNCTION public.log_role_changes_to_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      action_category,
      target_user_id,
      severity,
      description,
      metadata
    ) VALUES (
      COALESCE(NEW.created_by, auth.uid()),
      'role_assigned',
      'role_management',
      NEW.user_id,
      'warning',
      format('Role "%s" assigned to user', NEW.role),
      jsonb_build_object('role', NEW.role::text)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      action_category,
      target_user_id,
      severity,
      description,
      metadata
    ) VALUES (
      auth.uid(),
      'role_revoked',
      'role_management',
      OLD.user_id,
      'warning',
      format('Role "%s" revoked from user', OLD.role),
      jsonb_build_object('role', OLD.role::text)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS trigger_log_role_changes ON public.user_roles;
CREATE TRIGGER trigger_log_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes_to_audit();

-- Trigger to log MFA recovery code usage
CREATE OR REPLACE FUNCTION public.log_mfa_recovery_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.used = FALSE AND NEW.used = TRUE THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action_type,
      action_category,
      severity,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'mfa_recovery_code_used',
      'mfa',
      'warning',
      'MFA recovery code used for authentication',
      jsonb_build_object(
        'code_id', NEW.id,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for MFA recovery code usage
DROP TRIGGER IF EXISTS trigger_log_mfa_recovery ON public.mfa_recovery_codes;
CREATE TRIGGER trigger_log_mfa_recovery
  AFTER UPDATE ON public.mfa_recovery_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mfa_recovery_usage();

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION public.get_audit_log_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_actions BIGINT,
  actions_by_category JSONB,
  actions_by_severity JSONB,
  top_admins JSONB,
  recent_critical_events BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_total BIGINT;
  v_by_category JSONB;
  v_by_severity JSONB;
  v_top_admins JSONB;
  v_critical_count BIGINT;
BEGIN
  v_start_date := NOW() - (p_days || ' days')::INTERVAL;
  
  -- Get total actions
  SELECT COUNT(*) INTO v_total
  FROM public.admin_audit_log
  WHERE created_at >= v_start_date;
  
  -- Get actions by category
  SELECT jsonb_object_agg(action_category, category_count)
  INTO v_by_category
  FROM (
    SELECT 
      action_category,
      COUNT(*) as category_count
    FROM public.admin_audit_log
    WHERE created_at >= v_start_date
    GROUP BY action_category
  ) cat;
  
  -- Get actions by severity
  SELECT jsonb_object_agg(severity, severity_count)
  INTO v_by_severity
  FROM (
    SELECT 
      severity,
      COUNT(*) as severity_count
    FROM public.admin_audit_log
    WHERE created_at >= v_start_date
    GROUP BY severity
  ) sev;
  
  -- Get top admins
  SELECT jsonb_object_agg(admin_email, action_count)
  INTO v_top_admins
  FROM (
    SELECT 
      COALESCE(au.email, 'Unknown') as admin_email,
      COUNT(*) as action_count
    FROM public.admin_audit_log aal
    LEFT JOIN auth.users au ON aal.admin_user_id = au.id
    WHERE aal.created_at >= v_start_date
    GROUP BY au.email
    ORDER BY action_count DESC
    LIMIT 10
  ) admins;
  
  -- Get critical events count
  SELECT COUNT(*) INTO v_critical_count
  FROM public.admin_audit_log
  WHERE severity = 'critical'
    AND created_at >= v_start_date;
  
  RETURN QUERY SELECT 
    v_total,
    COALESCE(v_by_category, '{}'::jsonb),
    COALESCE(v_by_severity, '{}'::jsonb),
    COALESCE(v_top_admins, '{}'::jsonb),
    v_critical_count;
END;
$$;

COMMENT ON TABLE public.admin_audit_log IS 'Comprehensive audit log for all admin actions, MFA events, and security incidents';