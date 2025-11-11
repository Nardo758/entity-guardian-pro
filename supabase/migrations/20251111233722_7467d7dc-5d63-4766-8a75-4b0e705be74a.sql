-- Fix Critical RLS Policy Issues  
-- This migration secures publicly exposed tables without altering Stripe functionality

-- 1. Fix subscribers table - Strengthen authentication check
DROP POLICY IF EXISTS "select_own_subscription" ON subscribers;

CREATE POLICY "authenticated_users_own_subscription" ON subscribers
FOR SELECT USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- 2. Fix stripe_events table - Remove public access, admin only
DROP POLICY IF EXISTS "Service role can manage stripe events" ON stripe_events;
DROP POLICY IF EXISTS "service_role_all_events" ON stripe_events;

CREATE POLICY "admin_view_stripe_events" ON stripe_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- 3. Fix stripe_invoices table - Remove public access, user and admin only
DROP POLICY IF EXISTS "Service role can manage all invoices" ON stripe_invoices;
DROP POLICY IF EXISTS "service_role_all_invoices" ON stripe_invoices;
DROP POLICY IF EXISTS "select_own_invoices" ON stripe_invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON stripe_invoices;

-- Users view their own invoices
CREATE POLICY "users_view_own_invoices" ON stripe_invoices
FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all invoices for support
CREATE POLICY "admin_view_all_invoices" ON stripe_invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- 4. Fix ip_reputation table - Remove public access, admin only
DROP POLICY IF EXISTS "Service role can manage IP reputation" ON ip_reputation;

CREATE POLICY "admin_manage_ip_reputation" ON ip_reputation
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Note: Service role key bypasses RLS automatically for backend operations
-- Stripe webhook uses service_role_key so these changes won't affect webhook processing