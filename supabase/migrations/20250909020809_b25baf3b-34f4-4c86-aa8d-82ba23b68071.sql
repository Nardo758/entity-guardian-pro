-- Fix Security Definer View Issue
-- Remove the problematic security definer view and replace with proper RLS-based access

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.secure_admin_profiles;

-- Instead, update the profiles RLS policy to handle masking through the existing functions
-- The masking will be handled in application code for better security control

-- Create a simple function to check if current user should see masked data
CREATE OR REPLACE FUNCTION public.should_mask_profile_data(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() != target_user_id AND
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    );
$$;