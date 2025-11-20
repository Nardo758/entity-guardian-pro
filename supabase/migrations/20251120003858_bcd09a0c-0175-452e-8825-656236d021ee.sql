-- Fix search_path security warning for validate_ip_address function
CREATE OR REPLACE FUNCTION validate_ip_address()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow NULL IPs (for user_id based rate limiting)
  IF NEW.ip_address IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Validate that IP address can be cast to inet type
  -- This will fail if the IP is invalid like 'client', 'unknown', etc.
  BEGIN
    PERFORM NEW.ip_address::inet;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid IP address: %', NEW.ip_address;
  END;
  
  RETURN NEW;
END;
$$;