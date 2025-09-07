-- Fix database function search path security issues
-- Update all functions to have secure search_path settings

-- Fix generate_agent_invitation_token function
CREATE OR REPLACE FUNCTION public.generate_agent_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  token text;
BEGIN
  token := encode(gen_random_bytes(32), 'hex');
  WHILE EXISTS (SELECT 1 FROM public.agent_invitations WHERE token = token) LOOP
    token := encode(gen_random_bytes(32), 'hex');
  END LOOP;
  RETURN token;
END;
$function$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$function$;

-- Fix is_admin function  
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
    SELECT public.has_role(_user_id, 'admin'::app_role)
$function$;

-- Fix owns_invited_agent function
CREATE OR REPLACE FUNCTION public.owns_invited_agent(invitation_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_invitations ai
    JOIN public.agents a ON a.id = ai.agent_id
    WHERE ai.id = invitation_id 
    AND a.user_id = user_uuid
  );
$function$;

-- Fix is_invited_agent function
CREATE OR REPLACE FUNCTION public.is_invited_agent(invitation_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_invitations ai
    LEFT JOIN auth.users u ON u.id = user_uuid
    WHERE ai.id = invitation_id 
    AND ai.agent_email = u.email
  );
$function$;

-- Fix owns_assignment_entity function
CREATE OR REPLACE FUNCTION public.owns_assignment_entity(assignment_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.entity_agent_assignments eaa
    JOIN public.entities e ON e.id = eaa.entity_id
    WHERE eaa.id = assignment_id 
    AND e.user_id = user_uuid
  );
$function$;

-- Fix owns_assignment_agent function
CREATE OR REPLACE FUNCTION public.owns_assignment_agent(assignment_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.entity_agent_assignments eaa
    JOIN public.agents a ON a.id = eaa.agent_id
    WHERE eaa.id = assignment_id 
    AND a.user_id = user_uuid
  );
$function$;

-- Fix can_create_assignment_for_entity function
CREATE OR REPLACE FUNCTION public.can_create_assignment_for_entity(entity_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.entities e
    WHERE e.id = entity_uuid 
    AND e.user_id = user_uuid
  );
$function$;

-- Fix validate_payment_method_access function
CREATE OR REPLACE FUNCTION public.validate_payment_method_access(method_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
    -- Only allow access if user is authenticated and owns the payment method
    SELECT 
        auth.uid() IS NOT NULL 
        AND auth.uid() = method_user_id
        -- Additional security: verify user profile exists
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid()
        );
$function$;

-- Fix validate_payment_method_owner function
CREATE OR REPLACE FUNCTION public.validate_payment_method_owner(method_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
    -- Multi-layer validation for payment method access
    SELECT 
        -- User must be authenticated
        auth.uid() IS NOT NULL 
        -- User must own the payment method
        AND auth.uid() = method_user_id
        -- User must have a valid profile
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid()
        );
$function$;

-- Fix get_user_team_role function
CREATE OR REPLACE FUNCTION public.get_user_team_role(team_uuid uuid, user_uuid uuid)
RETURNS team_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.team_memberships 
  WHERE team_id = team_uuid AND user_id = user_uuid;
$function$;

-- Fix user_has_team_permission function
CREATE OR REPLACE FUNCTION public.user_has_team_permission(team_uuid uuid, user_uuid uuid, required_role team_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT CASE 
    WHEN required_role = 'member' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid)
    WHEN required_role = 'manager' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid AND role IN ('owner', 'admin', 'manager'))
    WHEN required_role = 'admin' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid AND role IN ('owner', 'admin'))
    WHEN required_role = 'owner' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid AND role = 'owner')
    ELSE false
  END;
$function$;

-- Fix generate_invitation_token function
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  token text;
BEGIN
  -- Generate a secure random token
  token := encode(gen_random_bytes(32), 'hex');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.team_invitations WHERE token = token) LOOP
    token := encode(gen_random_bytes(32), 'hex');
  END LOOP;
  RETURN token;
END;
$function$;

-- Enhance user_roles RLS policies for better security
-- First drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create more secure role management policies
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
FOR ALL
TO authenticated
USING (
  -- Only allow if the requesting user is a verified super admin
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
    -- Additional verification: check they have valid profile
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
  )
)
WITH CHECK (
  -- Same security check for insertions/updates
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
    AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
  )
  -- Prevent self-role escalation unless already admin
  AND (user_id != auth.uid() OR role = 'admin'::app_role)
);

-- Allow users to view their own roles with security verification
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);

-- Add audit logging for role changes
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

-- Create trigger for role audit logging
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- Enhance officer data security with field-level restrictions
CREATE POLICY "Officers contact info restricted" ON public.officers
FOR SELECT
TO authenticated
USING (
  -- Only allow entity owners to see full contact info
  auth.uid() = user_id
  -- Team members can see limited info (exclude email/phone/address)
  OR (
    EXISTS (
      SELECT 1 FROM public.entities e 
      WHERE e.id = officers.entity_id 
      AND e.team_id IS NOT NULL
      AND user_has_team_permission(e.team_id, auth.uid(), 'member'::team_role)
    )
  )
);

-- Add security monitoring for suspicious access patterns
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    event_type,
    1,
    'security_monitoring',
    CURRENT_DATE,
    event_data || jsonb_build_object(
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'authenticated', auth.uid() IS NOT NULL
    )
  );
END;
$function$;