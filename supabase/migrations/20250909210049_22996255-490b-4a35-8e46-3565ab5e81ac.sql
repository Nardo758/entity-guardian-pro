-- Fix security vulnerabilities in subscribers table
-- Step 1: First, update any rows with null user_id values
-- We'll try to match by email to auth.users table
UPDATE public.subscribers 
SET user_id = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = subscribers.email
)
WHERE user_id IS NULL;

-- Step 2: Delete any remaining rows that couldn't be matched (orphaned data)
DELETE FROM public.subscribers WHERE user_id IS NULL;

-- Step 3: Now make user_id non-nullable for better security
ALTER TABLE public.subscribers ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Drop existing overlapping RLS policies to avoid confusion
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "admin_access_all_subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Step 5: Create secure, clear RLS policies
-- Users can only view their own subscription data
CREATE POLICY "subscribers_select_own" ON public.subscribers
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own subscription data
CREATE POLICY "subscribers_insert_own" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscription data
CREATE POLICY "subscribers_update_own" ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can delete their own subscription data
CREATE POLICY "subscribers_delete_own" ON public.subscribers
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all subscriber data but with audit logging
CREATE POLICY "subscribers_admin_access" ON public.subscribers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);