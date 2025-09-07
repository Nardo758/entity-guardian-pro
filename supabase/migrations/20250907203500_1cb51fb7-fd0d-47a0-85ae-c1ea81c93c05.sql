-- Fix Agent RLS Policy - Remove overly permissive condition that exposes agent contact information
DROP POLICY IF EXISTS "Secure agent profile access" ON public.agents;

-- Create more restrictive agent access policy
CREATE POLICY "Secure agent profile access" ON public.agents
FOR SELECT USING (
  -- Agents can view their own profile
  (auth.uid() = user_id) 
  OR 
  -- Entity owners can view agents directly assigned to their entities
  (EXISTS (
    SELECT 1 FROM entity_agent_assignments eaa
    JOIN entities e ON e.id = eaa.entity_id
    WHERE eaa.agent_id = agents.id 
    AND e.user_id = auth.uid()
    AND eaa.status = 'accepted'
  ))
);