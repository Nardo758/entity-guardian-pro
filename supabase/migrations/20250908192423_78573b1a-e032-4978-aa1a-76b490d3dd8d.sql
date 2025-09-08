-- Fix user_type constraint to allow registered_agent value
ALTER TABLE public.profiles 
DROP CONSTRAINT profiles_user_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type = ANY (ARRAY['owner'::text, 'agent'::text, 'registered_agent'::text]));