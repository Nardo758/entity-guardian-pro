-- Fix infinite recursion in RLS policies by creating security definer functions
-- Drop problematic policies first
DROP POLICY IF EXISTS "admin_access_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = user_uuid 
    AND ur.role = 'admin'::app_role
  );
$$;

-- Recreate policies using security definer functions
CREATE POLICY "admin_access_all_profiles" ON public.profiles
FOR ALL
USING ((auth.uid() = user_id) OR public.get_current_user_admin_status())
WITH CHECK ((auth.uid() = user_id) OR public.get_current_user_admin_status());

CREATE POLICY "admins_can_manage_all_roles" ON public.user_roles
FOR ALL
USING (public.get_current_user_admin_status())
WITH CHECK (public.get_current_user_admin_status());

CREATE POLICY "users_can_view_own_roles" ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());