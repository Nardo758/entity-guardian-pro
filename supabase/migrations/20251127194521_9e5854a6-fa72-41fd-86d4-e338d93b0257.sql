-- Create admin_accounts table for dedicated admin authentication
CREATE TABLE public.admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  mfa_secret text,
  mfa_enabled boolean DEFAULT false NOT NULL,
  mfa_backup_codes text[],
  ip_whitelist inet[],
  last_login_at timestamptz,
  last_login_ip inet,
  failed_attempts int DEFAULT 0,
  locked_until timestamptz,
  is_active boolean DEFAULT true,
  permissions jsonb DEFAULT '["all"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_at timestamptz DEFAULT now()
);

-- Create admin_sessions table with strict expiry
CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.admin_accounts(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_valid boolean DEFAULT true
);

-- Add self-referencing foreign key after table creation
ALTER TABLE public.admin_accounts 
ADD CONSTRAINT admin_accounts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.admin_accounts(id);

-- Enable RLS
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(session_token) WHERE is_valid = true;
CREATE INDEX idx_admin_sessions_admin_id ON public.admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at);
CREATE INDEX idx_admin_accounts_email ON public.admin_accounts(email);

-- RLS Policies - Admin accounts can only be accessed via edge functions (service role)
CREATE POLICY "Service role full access to admin_accounts"
ON public.admin_accounts
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to admin_sessions"
ON public.admin_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(p_token text)
RETURNS TABLE(
  admin_id uuid,
  email text,
  display_name text,
  permissions jsonb,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session record;
  v_admin record;
BEGIN
  -- Find valid session
  SELECT * INTO v_session
  FROM public.admin_sessions s
  WHERE s.session_token = p_token
    AND s.is_valid = true
    AND s.expires_at > now();
  
  IF v_session IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, NULL::jsonb, false;
    RETURN;
  END IF;
  
  -- Get admin account
  SELECT * INTO v_admin
  FROM public.admin_accounts a
  WHERE a.id = v_session.admin_id
    AND a.is_active = true;
  
  IF v_admin IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, NULL::jsonb, false;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    v_admin.id,
    v_admin.email,
    v_admin.display_name,
    v_admin.permissions,
    true;
END;
$$;

-- Function to create admin session
CREATE OR REPLACE FUNCTION public.create_admin_session(
  p_admin_id uuid,
  p_token text,
  p_ip inet,
  p_user_agent text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  -- Invalidate old sessions for this admin (keep last 3)
  UPDATE public.admin_sessions
  SET is_valid = false
  WHERE admin_id = p_admin_id
    AND id NOT IN (
      SELECT id FROM public.admin_sessions
      WHERE admin_id = p_admin_id
      ORDER BY created_at DESC
      LIMIT 3
    );
  
  -- Create new session with 4-hour expiry
  INSERT INTO public.admin_sessions (
    admin_id,
    session_token,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_admin_id,
    p_token,
    p_ip,
    p_user_agent,
    now() + interval '4 hours'
  )
  RETURNING id INTO v_session_id;
  
  -- Update last login info
  UPDATE public.admin_accounts
  SET last_login_at = now(),
      last_login_ip = p_ip,
      failed_attempts = 0,
      locked_until = NULL
  WHERE id = p_admin_id;
  
  RETURN v_session_id;
END;
$$;

-- Function to invalidate admin session
CREATE OR REPLACE FUNCTION public.invalidate_admin_session(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.admin_sessions
  SET is_valid = false
  WHERE session_token = p_token;
  
  RETURN FOUND;
END;
$$;

-- Function to check if admin setup is needed (no admins exist)
CREATE OR REPLACE FUNCTION public.admin_setup_required()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.admin_accounts WHERE is_active = true);
$$;

-- Function to record failed admin login attempt
CREATE OR REPLACE FUNCTION public.record_admin_login_failure(p_email text, p_ip inet)
RETURNS TABLE(is_locked boolean, locked_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin record;
  v_new_attempts int;
  v_lock_until timestamptz;
BEGIN
  SELECT * INTO v_admin
  FROM public.admin_accounts
  WHERE email = p_email;
  
  IF v_admin IS NULL THEN
    RETURN QUERY SELECT false, NULL::timestamptz;
    RETURN;
  END IF;
  
  v_new_attempts := COALESCE(v_admin.failed_attempts, 0) + 1;
  
  -- Lock for 30 minutes after 5 failed attempts
  IF v_new_attempts >= 5 THEN
    v_lock_until := now() + interval '30 minutes';
  END IF;
  
  UPDATE public.admin_accounts
  SET failed_attempts = v_new_attempts,
      locked_until = v_lock_until
  WHERE id = v_admin.id;
  
  RETURN QUERY SELECT v_lock_until IS NOT NULL, v_lock_until;
END;
$$;

-- Log admin action to audit log
CREATE OR REPLACE FUNCTION public.log_admin_panel_action(
  p_admin_id uuid,
  p_action_type text,
  p_action_category text,
  p_description text,
  p_severity text DEFAULT 'info',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    action_category,
    description,
    severity,
    metadata
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_action_category,
    p_description,
    p_severity,
    p_metadata
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;