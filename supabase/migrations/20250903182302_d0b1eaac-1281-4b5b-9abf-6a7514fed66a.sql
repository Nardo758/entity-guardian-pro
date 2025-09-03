-- Clean up duplicate policies - merge into a single comprehensive policy
DROP POLICY IF EXISTS "Authenticated users can view agents for hiring purposes" ON public.agents;
DROP POLICY IF EXISTS "Agents can view all agent profiles" ON public.agents;

-- Create a single, clear policy for viewing agents
CREATE POLICY "Authenticated users can view agents" 
ON public.agents 
FOR SELECT 
TO authenticated
USING (true);