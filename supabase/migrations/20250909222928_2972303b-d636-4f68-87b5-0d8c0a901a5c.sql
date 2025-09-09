-- Security fix batch 1: Strengthen subscribers table policies
DROP POLICY IF EXISTS "subscribers_select_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_update_own" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_insert_own" ON public.subscribers;

-- Recreate with stronger validation
CREATE POLICY "subscribers_secure_select" ON public.subscribers
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
);

CREATE POLICY "subscribers_secure_update" ON public.subscribers
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "subscribers_secure_insert" ON public.subscribers
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND user_id IS NOT NULL
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
);