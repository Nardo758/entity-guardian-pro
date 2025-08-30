-- Add user_type to profiles table to distinguish between owners and agents
ALTER TABLE public.profiles ADD COLUMN user_type text DEFAULT 'owner' CHECK (user_type IN ('owner', 'agent'));

-- Create agents table for registered agent profiles
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  states text[] NOT NULL DEFAULT '{}',
  price_per_entity integer NOT NULL DEFAULT 199,
  contact_email text,
  is_available boolean NOT NULL DEFAULT true,
  bio text,
  years_experience integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create entity_agent_assignments table to track agent-entity relationships
CREATE TABLE public.entity_agent_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'terminated')),
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  invitation_token text UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entity_id, agent_id)
);

-- Create agent_invitations table for invitation management
CREATE TABLE public.agent_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  entity_owner_id uuid NOT NULL,
  agent_email text NOT NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents table
CREATE POLICY "Agents can view all agents" ON public.agents
  FOR SELECT USING (true); -- Public directory

CREATE POLICY "Users can create their own agent profile" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can update their own profile" ON public.agents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Agents can delete their own profile" ON public.agents
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for entity_agent_assignments
CREATE POLICY "Entity owners and assigned agents can view assignments" ON public.entity_agent_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "Entity owners can create assignments" ON public.entity_agent_assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND user_id = auth.uid())
  );

CREATE POLICY "Entity owners and agents can update assignments" ON public.entity_agent_assignments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- RLS Policies for agent_invitations
CREATE POLICY "Entity owners can view their invitations" ON public.agent_invitations
  FOR SELECT USING (entity_owner_id = auth.uid());

CREATE POLICY "Invited agents can view invitations sent to them" ON public.agent_invitations
  FOR SELECT USING (
    agent_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );

CREATE POLICY "Entity owners can create invitations" ON public.agent_invitations
  FOR INSERT WITH CHECK (entity_owner_id = auth.uid());

CREATE POLICY "Entity owners and agents can update invitations" ON public.agent_invitations
  FOR UPDATE USING (
    entity_owner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.agents WHERE id = agent_id AND user_id = auth.uid())
  );

-- Add indexes for performance
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_states ON public.agents USING GIN(states);
CREATE INDEX idx_agents_available ON public.agents(is_available);
CREATE INDEX idx_entity_agent_assignments_entity_id ON public.entity_agent_assignments(entity_id);
CREATE INDEX idx_entity_agent_assignments_agent_id ON public.entity_agent_assignments(agent_id);
CREATE INDEX idx_entity_agent_assignments_status ON public.entity_agent_assignments(status);
CREATE INDEX idx_agent_invitations_token ON public.agent_invitations(token);
CREATE INDEX idx_agent_invitations_entity_owner_id ON public.agent_invitations(entity_owner_id);
CREATE INDEX idx_agent_invitations_agent_email ON public.agent_invitations(agent_email);

-- Add updated_at triggers
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entity_agent_assignments_updated_at
  BEFORE UPDATE ON public.entity_agent_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_invitations_updated_at
  BEFORE UPDATE ON public.agent_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invitation tokens
CREATE OR REPLACE FUNCTION public.generate_agent_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token text;
BEGIN
  token := encode(gen_random_bytes(32), 'hex');
  WHILE EXISTS (SELECT 1 FROM public.agent_invitations WHERE token = token) LOOP
    token := encode(gen_random_bytes(32), 'hex');
  END LOOP;
  RETURN token;
END;
$$;