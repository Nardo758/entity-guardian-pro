-- Enhanced security for payment_methods table - careful approach
-- First, check and drop existing policies safely
DO $$ 
BEGIN
    -- Drop all existing policies on payment_methods table
    DROP POLICY IF EXISTS "Users can create their own payment methods" ON public.payment_methods;
    DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
    DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
    DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;
    DROP POLICY IF EXISTS "payment_methods_secure_select" ON public.payment_methods;
    DROP POLICY IF EXISTS "payment_methods_secure_insert" ON public.payment_methods;
    DROP POLICY IF EXISTS "payment_methods_secure_update" ON public.payment_methods;
    DROP POLICY IF EXISTS "payment_methods_secure_delete" ON public.payment_methods;
    DROP POLICY IF EXISTS "payment_methods_deny_anonymous" ON public.payment_methods;
END $$;

-- Create security definer function for payment method validation
CREATE OR REPLACE FUNCTION public.validate_payment_method_owner(method_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- Multi-layer validation for payment method access
    SELECT 
        -- User must be authenticated
        auth.uid() IS NOT NULL 
        -- User must own the payment method
        AND auth.uid() = method_user_id
        -- User must have a valid profile
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid()
        );
$$;

-- Create enhanced RLS policies

-- SELECT: Strongest restrictions for viewing financial data
CREATE POLICY "secure_payment_methods_select" 
ON public.payment_methods 
FOR SELECT
TO authenticated
USING (
    public.validate_payment_method_owner(user_id)
);

-- INSERT: Validate new payment method creation
CREATE POLICY "secure_payment_methods_insert"
ON public.payment_methods
FOR INSERT
TO authenticated
WITH CHECK (
    -- Must be authenticated and own the record
    auth.uid() = user_id
    AND public.validate_payment_method_owner(user_id)
    -- Additional data validation
    AND (last_four IS NULL OR (last_four ~ '^[0-9]{4}$'))
);

-- UPDATE: Restrict what can be updated
CREATE POLICY "secure_payment_methods_update"
ON public.payment_methods
FOR UPDATE
TO authenticated
USING (public.validate_payment_method_owner(user_id))
WITH CHECK (
    -- Cannot change ownership
    auth.uid() = user_id
    AND public.validate_payment_method_owner(user_id)
);

-- DELETE: Allow users to delete their own methods
CREATE POLICY "secure_payment_methods_delete"
ON public.payment_methods
FOR DELETE
TO authenticated
USING (public.validate_payment_method_owner(user_id));

-- Explicit DENY for anonymous users
CREATE POLICY "deny_anonymous_payment_access"
ON public.payment_methods
FOR ALL
TO anon
USING (false);

-- Ensure RLS is enabled
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;