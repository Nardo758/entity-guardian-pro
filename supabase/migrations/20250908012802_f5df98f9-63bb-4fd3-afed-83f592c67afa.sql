-- Fix remaining functions with search_path issues

-- Fix schedule_renewal_reminders function
CREATE OR REPLACE FUNCTION public.schedule_renewal_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_prefs record;
  reminder_day integer;
  reminder_date timestamp with time zone;
BEGIN
  -- Get user preferences for this entity's owner
  SELECT * INTO user_prefs 
  FROM public.notification_preferences 
  WHERE user_id = NEW.user_id;
  
  -- If no preferences found, use defaults
  IF user_prefs IS NULL THEN
    user_prefs.reminder_days_before := ARRAY[30, 14, 7, 1];
    user_prefs.email_notifications := true;
    user_prefs.notification_types := ARRAY['renewal_reminder'];
  END IF;
  
  -- Only proceed if renewal_reminder notifications are enabled
  IF 'renewal_reminder' = ANY(user_prefs.notification_types) THEN
    -- Schedule reminders for registered agent fee due date
    IF NEW.registered_agent_fee_due_date IS NOT NULL THEN
      FOREACH reminder_day IN ARRAY user_prefs.reminder_days_before
      LOOP
        reminder_date := (NEW.registered_agent_fee_due_date::date - reminder_day * INTERVAL '1 day')::timestamp with time zone;
        
        -- Only schedule future reminders
        IF reminder_date > now() THEN
          INSERT INTO public.scheduled_notifications (
            user_id,
            entity_id,
            notification_type,
            title,
            message,
            scheduled_for,
            metadata
          ) VALUES (
            NEW.user_id,
            NEW.id,
            'renewal_reminder',
            'Registered Agent Fee Due Soon',
            format('Your registered agent fee for %s is due in %s days (%s)', 
              NEW.name, 
              reminder_day, 
              NEW.registered_agent_fee_due_date
            ),
            reminder_date,
            jsonb_build_object(
              'entity_name', NEW.name,
              'fee_type', 'registered_agent_fee',
              'amount', NEW.registered_agent_fee,
              'due_date', NEW.registered_agent_fee_due_date,
              'days_before', reminder_day
            )
          );
        END IF;
      END LOOP;
    END IF;
    
    -- Schedule reminders for independent director fee due date
    IF NEW.independent_director_fee_due_date IS NOT NULL THEN
      FOREACH reminder_day IN ARRAY user_prefs.reminder_days_before
      LOOP
        reminder_date := (NEW.independent_director_fee_due_date::date - reminder_day * INTERVAL '1 day')::timestamp with time zone;
        
        -- Only schedule future reminders
        IF reminder_date > now() THEN
          INSERT INTO public.scheduled_notifications (
            user_id,
            entity_id,
            notification_type,
            title,
            message,
            scheduled_for,
            metadata
          ) VALUES (
            NEW.user_id,
            NEW.id,
            'renewal_reminder',
            'Independent Director Fee Due Soon',
            format('Your independent director fee for %s is due in %s days (%s)', 
              NEW.name, 
              reminder_day, 
              NEW.independent_director_fee_due_date
            ),
            reminder_date,
            jsonb_build_object(
              'entity_name', NEW.name,
              'fee_type', 'independent_director_fee',
              'amount', NEW.independent_director_fee,
              'due_date', NEW.independent_director_fee_due_date,
              'days_before', reminder_day
            )
          );
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix schedule_payment_reminders function
CREATE OR REPLACE FUNCTION public.schedule_payment_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_prefs record;
  reminder_day integer;
  reminder_date timestamp with time zone;
BEGIN
  -- Get user preferences for this payment's owner
  SELECT * INTO user_prefs 
  FROM public.notification_preferences 
  WHERE user_id = NEW.user_id;
  
  -- If no preferences found, use defaults
  IF user_prefs IS NULL THEN
    user_prefs.reminder_days_before := ARRAY[30, 14, 7, 1];
    user_prefs.email_notifications := true;
    user_prefs.notification_types := ARRAY['payment_due'];
  END IF;
  
  -- Only proceed if payment_due notifications are enabled and payment is pending
  IF 'payment_due' = ANY(user_prefs.notification_types) AND NEW.status = 'pending' THEN
    FOREACH reminder_day IN ARRAY user_prefs.reminder_days_before
    LOOP
      reminder_date := (NEW.due_date::date - reminder_day * INTERVAL '1 day')::timestamp with time zone;
      
      -- Only schedule future reminders
      IF reminder_date > now() THEN
        INSERT INTO public.scheduled_notifications (
          user_id,
          notification_type,
          title,
          message,
          scheduled_for,
          metadata
        ) VALUES (
          NEW.user_id,
          'payment_due',
          'Payment Due Soon',
          format('Your payment for %s (%s) is due in %s days (%s)', 
            NEW.entity_name,
            NEW.type, 
            reminder_day, 
            NEW.due_date
          ),
          reminder_date,
          jsonb_build_object(
            'entity_name', NEW.entity_name,
            'payment_type', NEW.type,
            'amount', NEW.amount,
            'due_date', NEW.due_date,
            'days_before', reminder_day,
            'payment_id', NEW.id
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, company, company_size, user_type)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'company',
    NEW.raw_user_meta_data ->> 'company_size',
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'owner')
  );
  RETURN NEW;
END;
$$;