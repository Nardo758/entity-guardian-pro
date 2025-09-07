-- Fix agent_invitations RLS policies to prevent unauthorized access and infinite recursion

-- First, drop all existing policies for agent_invitations
DROP POLICY IF EXISTS "Entity owners can view their invitations" ON public.agent_invitations;
DROP POLICY IF EXISTS "Invited agents can view invitations sent to them" ON public.agent_invitations;
DROP POLICY IF EXISTS "Entity owners can create invitations" ON public.agent_invitations;
DROP POLICY IF EXISTS "Entity owners and agents can update invitations" ON public.agent_invitations;

-- Create a security definer function to safely check if user is the invited agent
CREATE OR REPLACE FUNCTION public.is_invited_agent(invitation_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_invitations ai
    LEFT JOIN auth.users u ON u.id = user_uuid
    WHERE ai.id = invitation_id 
    AND ai.agent_email = u.email
  );
$$;

-- Create a security definer function to check if user owns an agent profile for this invitation
CREATE OR REPLACE FUNCTION public.owns_invited_agent(invitation_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_invitations ai
    JOIN public.agents a ON a.id = ai.agent_id
    WHERE ai.id = invitation_id 
    AND a.user_id = user_uuid
  );
$$;

-- Create secure RLS policies that prevent unauthorized access

-- Policy 1: Entity owners can view their own invitations
CREATE POLICY "Entity owners view own invitations"
ON public.agent_invitations
FOR SELECT
USING (entity_owner_id = auth.uid());

-- Policy 2: Invited agents can view invitations sent to their email (using security definer function)
CREATE POLICY "Invited agents view their invitations"
ON public.agent_invitations
FOR SELECT
USING (public.is_invited_agent(id, auth.uid()) OR public.owns_invited_agent(id, auth.uid()));

-- Policy 3: Only entity owners can create invitations for their entities
CREATE POLICY "Entity owners create invitations"
ON public.agent_invitations
FOR INSERT
WITH CHECK (
  entity_owner_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.entities e 
    WHERE e.id = entity_id 
    AND e.user_id = auth.uid()
  )
);

-- Policy 4: Only entity owners and invited agents can update invitations (for status changes)
CREATE POLICY "Authorized users update invitations"
ON public.agent_invitations
FOR UPDATE
USING (
  entity_owner_id = auth.uid() 
  OR public.is_invited_agent(id, auth.uid()) 
  OR public.owns_invited_agent(id, auth.uid())
)
WITH CHECK (
  entity_owner_id = auth.uid() 
  OR public.is_invited_agent(id, auth.uid()) 
  OR public.owns_invited_agent(id, auth.uid())
);

-- Policy 5: Prevent deletion of invitations - they should only be marked as declined/expired
-- No DELETE policy means no one can delete records

-- Add an index for better performance on the security functions
CREATE INDEX IF NOT EXISTS idx_agent_invitations_agent_email ON public.agent_invitations(agent_email);
CREATE INDEX IF NOT EXISTS idx_agent_invitations_entity_owner ON public.agent_invitations(entity_owner_id);