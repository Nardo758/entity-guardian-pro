-- Create a security definer function to safely get user email
CREATE OR REPLACE FUNCTION public.get_auth_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Drop the problematic policies that reference auth.users directly
DROP POLICY IF EXISTS "Agents can view invitations to their email" ON public.agent_invitations;
DROP POLICY IF EXISTS "Agents can respond to invitations" ON public.agent_invitations;

-- Recreate policies using the security definer function
CREATE POLICY "Agents can view invitations to their email" 
ON public.agent_invitations 
FOR SELECT 
USING (agent_email = public.get_auth_user_email());

CREATE POLICY "Agents can respond to invitations" 
ON public.agent_invitations 
FOR UPDATE 
USING (agent_email = public.get_auth_user_email());