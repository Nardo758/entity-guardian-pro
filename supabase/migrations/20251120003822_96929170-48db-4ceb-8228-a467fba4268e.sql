-- Clean up invalid IP addresses in api_rate_limits table
-- Remove entries where ip_address cannot be cast to valid inet

DELETE FROM api_rate_limits
WHERE ip_address::text NOT SIMILAR TO '([0-9]{1,3}\.){3}[0-9]{1,3}' -- IPv4
  AND ip_address::text NOT SIMILAR TO '([0-9a-fA-F:]+:+)+[0-9a-fA-F]+'; -- IPv6

-- Add a check to prevent future invalid IP addresses
-- Note: This will allow NULL but not invalid strings
CREATE OR REPLACE FUNCTION validate_ip_address()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to validate IP addresses on insert/update
DROP TRIGGER IF EXISTS validate_ip_on_insert ON api_rate_limits;
CREATE TRIGGER validate_ip_on_insert
  BEFORE INSERT OR UPDATE ON api_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION validate_ip_address();