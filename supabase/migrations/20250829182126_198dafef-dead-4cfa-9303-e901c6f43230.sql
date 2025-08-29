-- Check storage bucket policies for documents
SELECT * FROM storage.objects WHERE bucket_id = 'documents' LIMIT 5;

-- Create trigger to automatically generate analytics data when entities are created or updated
CREATE OR REPLACE FUNCTION public.generate_entity_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create trigger for automatic analytics generation
DROP TRIGGER IF EXISTS entity_analytics_trigger ON public.entities;
CREATE TRIGGER entity_analytics_trigger
  AFTER INSERT OR UPDATE ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.generate_entity_analytics();

-- Create trigger to generate analytics when payments are made
CREATE OR REPLACE FUNCTION public.generate_payment_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create trigger for payment analytics
DROP TRIGGER IF EXISTS payment_analytics_trigger ON public.payments;
CREATE TRIGGER payment_analytics_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_payment_analytics();

-- Ensure document storage bucket has proper RLS policies
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);