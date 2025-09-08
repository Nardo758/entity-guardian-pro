-- Check and fix all functions that might need proper search_path
-- Let me fix the common functions that might be causing issues

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_entity_analytics function if it exists
CREATE OR REPLACE FUNCTION public.generate_entity_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix generate_payment_analytics function
CREATE OR REPLACE FUNCTION public.generate_payment_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;