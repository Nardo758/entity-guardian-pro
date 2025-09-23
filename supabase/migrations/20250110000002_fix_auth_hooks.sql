-- Fix auth hooks for email confirmation
-- This creates the proper database trigger to call the send-auth-email function

-- First, ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to handle auth email sending
CREATE OR REPLACE FUNCTION public.handle_auth_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  url text;
BEGIN
  -- Only send email for signup confirmation or password recovery
  IF (NEW.email_confirmation_token IS NOT NULL AND NEW.email_confirmed_at IS NULL) 
     OR NEW.recovery_token IS NOT NULL THEN
    
    -- Construct the payload for the edge function
    payload := jsonb_build_object(
      'user', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'raw_user_meta_data', NEW.raw_user_meta_data
      ),
      'email_data', jsonb_build_object(
        'token', NEW.email_confirmation_token,
        'token_hash', NEW.email_confirmation_token_hash,
        'redirect_to', NEW.email_redirect_to,
        'email_action_type', CASE 
          WHEN NEW.email_confirmation_token IS NOT NULL AND NEW.email_confirmed_at IS NULL THEN 'signup'
          WHEN NEW.recovery_token IS NOT NULL THEN 'recovery'
          ELSE 'signup'
        END,
        'site_url', 'https://wcuxqopfcgivypbiynjp.supabase.co'
      )
    );

    -- Call the edge function
    url := 'https://wcuxqopfcgivypbiynjp.supabase.co/functions/v1/send-auth-email';
    
    -- Use pg_net to make HTTP request
    PERFORM net.http_post(
      url := url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload::text
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_send_auth_email ON auth.users;

-- Create trigger for auth email sending
CREATE TRIGGER trigger_send_auth_email
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_auth_email();
