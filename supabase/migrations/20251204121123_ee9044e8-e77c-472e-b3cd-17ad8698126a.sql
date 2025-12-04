-- Add missing entity columns for registered agent and independent director contact info
ALTER TABLE public.entities 
ADD COLUMN IF NOT EXISTS registered_agent_name text,
ADD COLUMN IF NOT EXISTS registered_agent_email text,
ADD COLUMN IF NOT EXISTS registered_agent_phone text,
ADD COLUMN IF NOT EXISTS registered_agent_fee_due_date date,
ADD COLUMN IF NOT EXISTS independent_director_name text,
ADD COLUMN IF NOT EXISTS independent_director_email text,
ADD COLUMN IF NOT EXISTS independent_director_phone text,
ADD COLUMN IF NOT EXISTS independent_director_fee_due_date date;