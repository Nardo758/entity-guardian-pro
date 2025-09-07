-- Fix entity_agent_assignments RLS policies to prevent unauthorized access and infinite recursion

-- First, drop all existing policies for entity_agent_assignments
DROP POLICY IF EXISTS "Entity owners and assigned agents can view assignments" ON public.entity_agent_assignments;
DROP POLICY IF EXISTS "Entity owners can create assignments" ON public.entity_agent_assignments;
DROP POLICY IF EXISTS "Entity owners and agents can update assignments" ON public.entity_agent_assignments;

-- Create security definer functions to safely check permissions without recursion

-- Function to check if user owns the entity in an assignment
CREATE OR REPLACE FUNCTION public.owns_assignment_entity(assignment_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entity_agent_assignments eaa
    JOIN public.entities e ON e.id = eaa.entity_id
    WHERE eaa.id = assignment_id 
    AND e.user_id = user_uuid
  );
$$;

-- Function to check if user owns the agent in an assignment
CREATE OR REPLACE FUNCTION public.owns_assignment_agent(assignment_id uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entity_agent_assignments eaa
    JOIN public.agents a ON a.id = eaa.agent_id
    WHERE eaa.id = assignment_id 
    AND a.user_id = user_uuid
  );
$$;

-- Function to check if user can create assignment for a specific entity
CREATE OR REPLACE FUNCTION public.can_create_assignment_for_entity(entity_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entities e
    WHERE e.id = entity_uuid 
    AND e.user_id = user_uuid
  );
$$;

-- Create secure RLS policies that prevent unauthorized access

-- Policy 1: Entity owners and assigned agents can view assignments
CREATE POLICY "Authorized users view assignments"
ON public.entity_agent_assignments
FOR SELECT
USING (
  public.owns_assignment_entity(id, auth.uid()) 
  OR public.owns_assignment_agent(id, auth.uid())
);

-- Policy 2: Only entity owners can create assignments for their entities
CREATE POLICY "Entity owners create assignments"
ON public.entity_agent_assignments
FOR INSERT
WITH CHECK (
  public.can_create_assignment_for_entity(entity_id, auth.uid())
);

-- Policy 3: Entity owners and assigned agents can update assignments (for status changes)
CREATE POLICY "Authorized users update assignments"
ON public.entity_agent_assignments
FOR UPDATE
USING (
  public.owns_assignment_entity(id, auth.uid()) 
  OR public.owns_assignment_agent(id, auth.uid())
)
WITH CHECK (
  public.owns_assignment_entity(id, auth.uid()) 
  OR public.owns_assignment_agent(id, auth.uid())
);

-- Policy 4: Prevent deletion of assignments - they should only be marked as terminated
-- No DELETE policy means no one can delete records

-- Add indexes for better performance on the security functions
CREATE INDEX IF NOT EXISTS idx_entity_agent_assignments_entity_id ON public.entity_agent_assignments(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_agent_assignments_agent_id ON public.entity_agent_assignments(agent_id);

-- Remove invitation_token column as it's redundant (invitations are tracked separately in agent_invitations)
-- This reduces data exposure and potential security risks
ALTER TABLE public.entity_agent_assignments DROP COLUMN IF EXISTS invitation_token;