-- Fix security vulnerability: Restrict agent data access to authenticated users only
-- Current policy allows anyone (including unauthenticated users) to view all agent data
-- This exposes sensitive business information like contact emails, pricing, and company details

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Agents can view all agents" ON public.agents;

-- Create a new policy that only allows authenticated users to view agents
-- This protects sensitive business data from competitors and unauthorized access
CREATE POLICY "Authenticated users can view agents for hiring purposes" 
ON public.agents 
FOR SELECT 
TO authenticated
USING (true);

-- Also ensure agents can still view all agents (including their own)
-- This is needed for the agent directory functionality
CREATE POLICY "Agents can view all agent profiles" 
ON public.agents 
FOR SELECT 
TO authenticated
USING (true);