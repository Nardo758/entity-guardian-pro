-- Fix Function Search Path Security Issues
-- All functions must have SET search_path = 'public' for security

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

CREATE OR REPLACE FUNCTION public.audit_payment_method_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- Log access attempts for security monitoring
    INSERT INTO public.analytics_data (
        user_id,
        metric_name,
        metric_value,
        metric_type,
        metric_date,
        metadata
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
        'payment_method_access',
        1,
        'security',
        CURRENT_DATE,
        jsonb_build_object(
            'action', TG_OP,
            'table', 'payment_methods',
            'timestamp', now(),
            'authenticated', auth.uid() IS NOT NULL
        )
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$;

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

CREATE OR REPLACE FUNCTION public.log_admin_user_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log profile changes made by admins
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    -- Check if the user making the change is an admin
    IF EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    ) THEN
      INSERT INTO admin_user_actions (
        admin_user_id,
        target_user_id,
        action_type,
        previous_value,
        new_value,
        reason
      ) VALUES (
        auth.uid(),
        NEW.user_id,
        CASE 
          WHEN OLD.account_status != NEW.account_status THEN 'status_change'
          WHEN OLD.user_type != NEW.user_type THEN 'role_change'
          ELSE 'profile_edit'
        END,
        to_jsonb(OLD),
        to_jsonb(NEW),
        COALESCE(NEW.suspension_reason, 'Admin profile update')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_entity_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Generate analytics data for new entities
  IF TG_OP = 'INSERT' THEN
    -- Insert entity creation metric
    INSERT INTO public.analytics_data (
      user_id,
      entity_id,
      metric_name,
      metric_value,
      metric_type,
      metric_date,
      metadata
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'Entity Created',
      1,
      'count',
      CURRENT_DATE,
      jsonb_build_object(
        'entity_name', NEW.name,
        'entity_type', NEW.type,
        'state', NEW.state,
        'formation_date', NEW.formation_date
      )
    );

    -- Insert cost projection analytics
    INSERT INTO public.analytics_data (
      user_id,
      entity_id,
      metric_name,
      metric_value,
      metric_type,
      metric_date,
      metadata
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'Annual Fees',
      COALESCE(NEW.registered_agent_fee, 0) + COALESCE(NEW.independent_director_fee, 0),
      'currency',
      CURRENT_DATE,
      jsonb_build_object(
        'registered_agent_fee', NEW.registered_agent_fee,
        'independent_director_fee', NEW.independent_director_fee
      )
    );

    -- Create cost projections
    IF NEW.registered_agent_fee IS NOT NULL THEN
      INSERT INTO public.cost_projections (
        user_id,
        entity_id,
        projection_name,
        projection_type,
        projected_amount,
        projection_date,
        metadata
      ) VALUES (
        NEW.user_id,
        NEW.id,
        'Registered Agent Fee - ' || NEW.name,
        'registered_agent_fee',
        NEW.registered_agent_fee,
        CURRENT_DATE,
        jsonb_build_object('entity_name', NEW.name)
      );
    END IF;

    -- Create compliance checks for new entities
    INSERT INTO public.compliance_checks (
      user_id,
      entity_id,
      check_name,
      check_type,
      status,
      due_date,
      notes
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'Annual Report Filing - ' || NEW.name,
      'annual_report',
      'pending',
      (CURRENT_DATE + INTERVAL '11 months')::date,
      'Annual report filing requirement for ' || NEW.type
    );

    RETURN NEW;
  END IF;

  -- Handle updates (if needed)
  IF TG_OP = 'UPDATE' THEN
    -- Update analytics if fees changed
    IF OLD.registered_agent_fee != NEW.registered_agent_fee OR 
       OLD.independent_director_fee != NEW.independent_director_fee THEN
      
      INSERT INTO public.analytics_data (
        user_id,
        entity_id,
        metric_name,
        metric_value,
        metric_type,
        metric_date,
        metadata
      ) VALUES (
        NEW.user_id,
        NEW.id,
        'Fee Update',
        COALESCE(NEW.registered_agent_fee, 0) + COALESCE(NEW.independent_director_fee, 0),
        'currency',
        CURRENT_DATE,
        jsonb_build_object(
          'old_total', COALESCE(OLD.registered_agent_fee, 0) + COALESCE(OLD.independent_director_fee, 0),
          'new_total', COALESCE(NEW.registered_agent_fee, 0) + COALESCE(NEW.independent_director_fee, 0)
        )
      );
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_payment_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Generate analytics when payment status changes to paid
  IF TG_OP = 'UPDATE' AND OLD.status != 'paid' AND NEW.status = 'paid' THEN
    INSERT INTO public.analytics_data (
      user_id,
      metric_name,
      metric_value,
      metric_type,
      metric_date,
      metadata
    ) VALUES (
      NEW.user_id,
      'Payment Completed',
      NEW.amount,
      'currency',
      CURRENT_DATE,
      jsonb_build_object(
        'entity_name', NEW.entity_name,
        'payment_type', NEW.type,
        'payment_method', NEW.payment_method
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;