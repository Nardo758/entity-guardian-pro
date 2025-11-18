-- Create agents table for registered agent profiles
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  states TEXT[] NOT NULL DEFAULT '{}',
  price_per_entity NUMERIC NOT NULL DEFAULT 0,
  contact_email TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  bio TEXT,
  years_experience INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Agents can view all agent profiles (for directory browsing)
CREATE POLICY "Agents can view all profiles"
  ON public.agents
  FOR SELECT
  USING (true);

-- Users can insert their own agent profile
CREATE POLICY "Users can create their own agent profile"
  ON public.agents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Agents can update their own profile
CREATE POLICY "Agents can update their own profile"
  ON public.agents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Agents can delete their own profile
CREATE POLICY "Agents can delete their own profile"
  ON public.agents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index on user_id for faster lookups
CREATE INDEX idx_agents_user_id ON public.agents(user_id);

-- Create index on states for filtering
CREATE INDEX idx_agents_states ON public.agents USING GIN(states);

-- Create index on is_available for directory queries
CREATE INDEX idx_agents_available ON public.agents(is_available);