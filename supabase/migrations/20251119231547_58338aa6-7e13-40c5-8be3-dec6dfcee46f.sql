-- Create agent_invitations table for tracking agent invitation requests
CREATE TABLE IF NOT EXISTS public.agent_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  agent_email TEXT NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'unsent')),
  token TEXT NOT NULL UNIQUE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  unsent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_agent_invitations_owner ON public.agent_invitations(entity_owner_id);
CREATE INDEX idx_agent_invitations_entity ON public.agent_invitations(entity_id);
CREATE INDEX idx_agent_invitations_agent_email ON public.agent_invitations(agent_email);
CREATE INDEX idx_agent_invitations_status ON public.agent_invitations(status);
CREATE INDEX idx_agent_invitations_token ON public.agent_invitations(token);

-- Enable RLS
ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;

-- Entity owners can view their sent invitations
CREATE POLICY "Entity owners can view their invitations"
  ON public.agent_invitations
  FOR SELECT
  USING (auth.uid() = entity_owner_id);

-- Entity owners can create invitations for their entities
CREATE POLICY "Entity owners can create invitations"
  ON public.agent_invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() = entity_owner_id AND
    EXISTS (
      SELECT 1 FROM public.entities e
      WHERE e.id = entity_id AND e.user_id = auth.uid()
    )
  );

-- Entity owners can update their invitations (e.g., to unsend)
CREATE POLICY "Entity owners can update their invitations"
  ON public.agent_invitations
  FOR UPDATE
  USING (auth.uid() = entity_owner_id);

-- Agents can view invitations sent to their email
CREATE POLICY "Agents can view invitations to their email"
  ON public.agent_invitations
  FOR SELECT
  USING (
    agent_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Agents can update invitations to accept/decline
CREATE POLICY "Agents can respond to invitations"
  ON public.agent_invitations
  FOR UPDATE
  USING (
    agent_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Add updated_at trigger
CREATE TRIGGER update_agent_invitations_updated_at
  BEFORE UPDATE ON public.agent_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create entity_agent_assignments table for accepted assignments
CREATE TABLE IF NOT EXISTS public.entity_agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  entity_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.agent_invitations(id) ON DELETE SET NULL,
  agreed_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'terminated')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  terminated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_id, agent_id, status)
);

-- Create indexes for assignments
CREATE INDEX idx_assignments_entity ON public.entity_agent_assignments(entity_id);
CREATE INDEX idx_assignments_agent ON public.entity_agent_assignments(agent_id);
CREATE INDEX idx_assignments_owner ON public.entity_agent_assignments(entity_owner_id);
CREATE INDEX idx_assignments_status ON public.entity_agent_assignments(status);

-- Enable RLS on assignments
ALTER TABLE public.entity_agent_assignments ENABLE ROW LEVEL SECURITY;

-- Entity owners can view assignments for their entities
CREATE POLICY "Entity owners can view their assignments"
  ON public.entity_agent_assignments
  FOR SELECT
  USING (auth.uid() = entity_owner_id);

-- Agents can view their assignments
CREATE POLICY "Agents can view their assignments"
  ON public.entity_agent_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_id AND a.user_id = auth.uid()
    )
  );

-- System can create assignments (from invitation acceptance)
CREATE POLICY "System can create assignments"
  ON public.entity_agent_assignments
  FOR INSERT
  WITH CHECK (true);

-- Entity owners can terminate assignments
CREATE POLICY "Entity owners can terminate assignments"
  ON public.entity_agent_assignments
  FOR UPDATE
  USING (auth.uid() = entity_owner_id);

-- Add updated_at trigger for assignments
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.entity_agent_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();