-- Enhanced security for payment_methods table
-- Drop existing policies to recreate them with stronger security
DROP POLICY IF EXISTS "Users can create their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;

-- Create security definer function for payment method validation
CREATE OR REPLACE FUNCTION public.validate_payment_method_access(method_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- Only allow access if user is authenticated and owns the payment method
    SELECT 
        auth.uid() IS NOT NULL 
        AND auth.uid() = method_user_id
        -- Additional security: verify user profile exists
        AND EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid()
        );
$$;

-- Create comprehensive RLS policies with multiple security layers

-- 1. SELECT policy - most restrictive
CREATE POLICY "payment_methods_secure_select" 
ON public.payment_methods 
FOR SELECT
TO authenticated
USING (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must own the payment method
    AND auth.uid() = user_id
    -- Additional validation through security definer function
    AND public.validate_payment_method_access(user_id)
);

-- 2. INSERT policy - validate ownership and authentication
CREATE POLICY "payment_methods_secure_insert"
ON public.payment_methods
FOR INSERT
TO authenticated
WITH CHECK (
    -- Must be authenticated
    auth.uid() IS NOT NULL
    -- Must set user_id to authenticated user
    AND auth.uid() = user_id
    -- Additional validation
    AND public.validate_payment_method_access(user_id)
    -- Prevent insertion of sensitive test data
    AND (stripe_payment_method_id IS NULL OR stripe_payment_method_id != 'test_pm_card_visa')
);

-- 3. UPDATE policy - restrict what can be updated
CREATE POLICY "payment_methods_secure_update"
ON public.payment_methods
FOR UPDATE
TO authenticated
USING (
    -- Must own existing record
    auth.uid() = user_id
    AND public.validate_payment_method_access(user_id)
)
WITH CHECK (
    -- Cannot change ownership
    auth.uid() = user_id
    -- Additional validation for updated record
    AND public.validate_payment_method_access(user_id)
);

-- 4. DELETE policy - allow users to delete their own methods
CREATE POLICY "payment_methods_secure_delete"
ON public.payment_methods
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id
    AND public.validate_payment_method_access(user_id)
);

-- 5. Explicit DENY policy for unauthenticated users
CREATE POLICY "payment_methods_deny_anonymous"
ON public.payment_methods
FOR ALL
TO anon
USING (false);

-- Add additional security constraints
ALTER TABLE public.payment_methods 
    -- Ensure user_id cannot be null (prevents orphaned records)
    ALTER COLUMN user_id SET NOT NULL,
    -- Add constraint to prevent obviously fake data
    ADD CONSTRAINT payment_methods_valid_data CHECK (
        (last_four IS NULL OR length(last_four) = 4)
        AND (routing_number IS NULL OR length(routing_number) >= 9)
    );

-- Create audit trigger for payment method access (security monitoring)
CREATE OR REPLACE FUNCTION public.audit_payment_method_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log access attempts for security monitoring
    INSERT INTO public.analytics_data (
        user_id,
        metric_name,
        metric_value,
        metric_type,
        metric_date,
        metadata
    ) VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
        'payment_method_access',
        1,
        'security',
        CURRENT_DATE,
        jsonb_build_object(
            'action', TG_OP,
            'table', 'payment_methods',
            'timestamp', now(),
            'authenticated', auth.uid() IS NOT NULL
        )
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- Apply audit trigger
DROP TRIGGER IF EXISTS payment_method_access_audit ON public.payment_methods;
CREATE TRIGGER payment_method_access_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.audit_payment_method_access();

-- Ensure RLS is enabled (should already be, but double-check)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;