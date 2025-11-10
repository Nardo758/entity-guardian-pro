-- Remove vulnerable ownership-based policies that allow privilege escalation
DROP POLICY IF EXISTS "ur_read_own" ON public.user_roles;
DROP POLICY IF EXISTS "ur_insert_self" ON public.user_roles;
DROP POLICY IF EXISTS "ur_update_own" ON public.user_roles;
DROP POLICY IF EXISTS "ur_delete_own" ON public.user_roles;

-- The secure admin-based policies remain in place:
-- "Admins can assign roles" - allows only admins to insert roles
-- "Admins can delete roles" - allows only admins to delete roles
-- "Admins can modify roles" - allows only admins to update roles
-- "Admins can view all roles" - allows admins to view all roles, users to view their own

-- Add comment explaining the security model
COMMENT ON TABLE public.user_roles IS 'User roles table. Only admins can assign/modify roles. Uses has_role() security definer function to prevent privilege escalation.';