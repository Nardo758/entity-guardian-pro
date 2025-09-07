-- Fix the teams table SELECT policy bug
-- The current policy has an incorrect join condition that prevents teams from loading

DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

-- Create corrected policy with proper join condition
CREATE POLICY "Users can view teams they belong to" 
ON public.teams 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
  )
);

-- Also ensure admin users can see all teams for administrative purposes
DROP POLICY IF EXISTS "Admins can view all teams" ON public.teams;

CREATE POLICY "Admins can view all teams" 
ON public.teams 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);