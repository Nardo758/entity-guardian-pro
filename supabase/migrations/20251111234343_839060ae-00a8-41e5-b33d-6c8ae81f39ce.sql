-- Drop unused security definer view that exposes admin status
DROP VIEW IF EXISTS public.is_admin_v CASCADE;

-- Ensure no views expose auth.users directly
-- The existing security definer functions (has_role, is_admin) are correct
-- and necessary for RLS policies to work without recursion

-- Add comment documenting the security model
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'Security definer function to check user roles. Used in RLS policies to prevent infinite recursion.';

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'Security definer function to check admin status. Used in RLS policies to prevent infinite recursion.';

-- Verify user_roles table has proper RLS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Note: Postgres version upgrades should be done through Supabase dashboard
-- at Settings > Infrastructure > Database version
-- This cannot be done via SQL migrations