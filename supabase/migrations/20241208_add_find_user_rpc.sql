-- Add RPC function for secure user lookup to prevent enumeration attacks
-- This function will be used instead of listing all users

CREATE OR REPLACE FUNCTION find_user_by_email(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data json;
BEGIN
    -- Only allow this function to be called by service role
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Find user by email in auth.users table
    SELECT to_json(u.*) INTO user_data
    FROM auth.users u
    WHERE u.email = user_email
    LIMIT 1;
    
    RETURN user_data;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION find_user_by_email(text) TO service_role;

-- Add index on auth.users email for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);

-- Add payment_intent_id column to subscribers table if it doesn't exist
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS payment_intent_id text;

-- Add unique constraint on payment_intent_id to prevent duplicate processing
ALTER TABLE subscribers 
ADD CONSTRAINT IF NOT EXISTS unique_payment_intent_id 
UNIQUE (payment_intent_id);

-- Add index for better performance on payment intent lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_payment_intent_id 
ON subscribers(payment_intent_id);