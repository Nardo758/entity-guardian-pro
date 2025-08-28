-- Fix critical security issues found after revert

-- 1. Fix overly permissive subscription policies
-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create proper restrictive policies for subscribers table
CREATE POLICY "Users can insert their own subscription" ON public.subscribers
FOR INSERT
WITH CHECK (auth.uid() = user_id OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id OR email = auth.email())
WITH CHECK (auth.uid() = user_id OR email = auth.email());

-- 2. Add missing DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile" ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);