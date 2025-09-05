-- Remove the agents_directory view entirely to resolve security definer view warning
-- The directory functionality can be handled through the updated RLS policies directly on the agents table

DROP VIEW IF EXISTS public.agents_directory;

-- The agents table now has proper RLS policies that:
-- 1. Allow agents to see their own full profiles
-- 2. Allow entity owners to see agents they have business relationships with  
-- 3. Allow directory-style access for available agents (with application-level filtering of sensitive fields)

-- This is more secure than having a separate view that might bypass RLS policies