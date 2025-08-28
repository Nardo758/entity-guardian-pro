-- Enhance notifications table with additional fields for email notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS notification_type text DEFAULT 'in_app',
ADD COLUMN IF NOT EXISTS entity_id uuid,
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone,
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Create notification_preferences table for user settings
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_notifications boolean DEFAULT true,
  reminder_days_before integer[] DEFAULT ARRAY[30, 14, 7, 1],
  notification_types text[] DEFAULT ARRAY['renewal_reminder', 'payment_due', 'compliance_check'],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" 
ON public.notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create scheduled_notifications table for the notification queue
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_id uuid,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error_message text,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled_notifications
CREATE POLICY "Users can view their own scheduled notifications" 
ON public.scheduled_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled notifications" 
ON public.scheduled_notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications" 
ON public.scheduled_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled notifications" 
ON public.scheduled_notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_notifications_updated_at
  BEFORE UPDATE ON public.scheduled_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically schedule renewal reminders
CREATE OR REPLACE FUNCTION public.schedule_renewal_reminders()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically schedule reminders when entities are created or updated
CREATE OR REPLACE TRIGGER trigger_schedule_renewal_reminders
  AFTER INSERT OR UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_renewal_reminders();

-- Create function to schedule payment reminders
CREATE OR REPLACE FUNCTION public.schedule_payment_reminders()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically schedule payment reminders
CREATE OR REPLACE TRIGGER trigger_schedule_payment_reminders
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_payment_reminders();