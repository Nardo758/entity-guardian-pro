-- Fix the duplicate policy issue

-- First, drop all existing policies on the agents table to clean up
DROP POLICY IF EXISTS "Agent directory basic access" ON public.agents;
DROP POLICY IF EXISTS "Entity owners can view agents they invited or are assigned to" ON public.agents;

-- Now create the consolidated, secure policy
CREATE POLICY "Secure agent profile access" 
ON public.agents 
FOR SELECT 
USING (
  -- Allow agents to see their own full profiles
  auth.uid() = user_id
  OR
  -- Allow entity owners to view agents they have business relationships with
  EXISTS (
    SELECT 1 
    FROM public.agent_invitations 
    WHERE agent_invitations.agent_id = agents.id 
    AND agent_invitations.entity_owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.entity_agent_assignments eaa
    JOIN public.entities e ON e.id = eaa.entity_id
    WHERE eaa.agent_id = agents.id 
    AND e.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.agent_invitations ai
    WHERE ai.agent_email = agents.contact_email 
    AND ai.entity_owner_id = auth.uid()
  )
);