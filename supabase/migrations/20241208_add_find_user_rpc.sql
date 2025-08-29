-- Add RPC function for secure user lookup to prevent enumeration attacks
-- This function will be used instead of listing all users

CREATE OR REPLACE FUNCTION public.find_user_by_email(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    user_data json;
BEGIN
    -- Only allow this function to be called by authenticated service role
    -- Check if current role has necessary permissions
    IF NOT (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'service_role'
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions';
    END IF;
    
    -- Find user by email in auth.users table
    SELECT to_json(u.*) INTO user_data
    FROM auth.users u
    WHERE u.email = user_email
    LIMIT 1;
    
    RETURN user_data;
END;
$$;

-- Grant execute permission to service role and authenticated users (for Edge Functions)
GRANT EXECUTE ON FUNCTION public.find_user_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(text) TO authenticated;

-- Add index on auth.users email for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);

-- Add payment_intent_id column to subscribers table if it doesn't exist
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS payment_intent_id text;

-- Add unique constraint on payment_intent_id to prevent duplicate processing
-- Use DO block to handle constraint existence check safely
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.subscribers 
        ADD CONSTRAINT unique_payment_intent_id UNIQUE (payment_intent_id);
    EXCEPTION
        WHEN duplicate_object THEN
            -- Constraint already exists, do nothing
            NULL;
    END;
END $$;

-- Add index for better performance on payment intent lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_payment_intent_id 
ON public.subscribers(payment_intent_id) WHERE payment_intent_id IS NOT NULL;