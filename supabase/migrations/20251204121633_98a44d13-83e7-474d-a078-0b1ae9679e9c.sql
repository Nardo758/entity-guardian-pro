-- Add missing team_id column to entities table
ALTER TABLE public.entities 
ADD COLUMN IF NOT EXISTS team_id uuid;