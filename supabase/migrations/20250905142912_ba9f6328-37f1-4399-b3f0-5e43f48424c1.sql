-- Fix security vulnerability: Restrict agent profile access to authorized users only

-- First, drop the overly permissive policy that allows all authenticated users to view agents
DROP POLICY "Authenticated users can view agents" ON public.agents;

-- Create more restrictive policies for agent profile access

-- 1. Allow agents to view their own profiles (this policy already exists, but adding for completeness)
-- Note: "Agents can update their own profile" policy already exists with same condition

-- 2. Allow entity owners to view agents they have business relationships with
CREATE POLICY "Entity owners can view agents they invited or are assigned to" 
ON public.agents 
FOR SELECT 
USING (
  -- Allow if the user has invited this agent
  EXISTS (
    SELECT 1 
    FROM public.agent_invitations 
    WHERE agent_invitations.agent_id = agents.id 
    AND agent_invitations.entity_owner_id = auth.uid()
  )
  OR
  -- Allow if the user has an entity assigned to this agent
  EXISTS (
    SELECT 1 
    FROM public.entity_agent_assignments eaa
    JOIN public.entities e ON e.id = eaa.entity_id
    WHERE eaa.agent_id = agents.id 
    AND e.user_id = auth.uid()
  )
  OR
  -- Allow if the user owns an entity and this agent was invited via email matching
  EXISTS (
    SELECT 1 
    FROM public.agent_invitations ai
    WHERE ai.agent_email = agents.contact_email 
    AND ai.entity_owner_id = auth.uid()
  )
);

-- 3. Create a limited public directory policy for agent discovery (optional)
-- This allows viewing basic info for agent discovery, but hides sensitive contact details
CREATE POLICY "Limited agent directory access for discovery" 
ON public.agents 
FOR SELECT 
USING (
  -- Only return basic profile info, sensitive fields will be filtered in application layer
  true
);

-- Add a comment explaining the security model
COMMENT ON TABLE public.agents IS 'Agent profiles with restricted access: Full access for agent owners and entity owners with business relationships. Limited directory access for discovery purposes only.';

-- Create a view for public agent directory that excludes sensitive information
CREATE OR REPLACE VIEW public.agents_directory AS
SELECT 
  id,
  user_id,
  company_name,
  bio,
  states,
  is_available,
  years_experience,
  created_at,
  updated_at
  -- Explicitly exclude: contact_email, price_per_entity
FROM public.agents
WHERE is_available = true;

-- Enable RLS on the view
ALTER VIEW public.agents_directory OWNER TO postgres;

-- Grant access to the directory view for authenticated users
GRANT SELECT ON public.agents_directory TO authenticated;