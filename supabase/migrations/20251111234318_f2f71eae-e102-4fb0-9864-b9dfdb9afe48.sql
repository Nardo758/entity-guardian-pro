-- Fix Supabase Infrastructure Security Issues
-- This migration addresses:
-- 1. Exposed auth.users via is_admin_v view
-- 2. Removes unnecessary views that could expose sensitive data

-- Drop the is_admin_v view that exposes auth.users
-- This view is not used in the codebase and poses a security risk
DROP VIEW IF EXISTS public.is_admin_v;

-- Note: The is_admin() and has_role() SECURITY DEFINER functions are correct and necessary
-- They prevent RLS recursion and are the proper way to check permissions
-- These functions are already in place and don't need modification

-- Verify that the proper security definer functions exist
-- These are safe and necessary for role checking without RLS recursion
DO $$
BEGIN
  -- Verify is_admin function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_admin' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'Critical security function is_admin() is missing. This should exist for proper admin checks.';
  END IF;

  -- Verify has_role function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' 
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'Critical security function has_role() is missing. This should exist for proper role checks.';
  END IF;

  RAISE NOTICE 'Security functions verified. Use is_admin(user_id) and has_role(user_id, role) for permission checks.';
END $$;

-- Add comment for future reference
COMMENT ON FUNCTION public.is_admin IS 'Security definer function to check admin status. Use this instead of direct auth.users queries to prevent security issues.';
COMMENT ON FUNCTION public.has_role IS 'Security definer function to check user roles. Use this instead of direct user_roles queries in RLS policies to prevent recursion.';