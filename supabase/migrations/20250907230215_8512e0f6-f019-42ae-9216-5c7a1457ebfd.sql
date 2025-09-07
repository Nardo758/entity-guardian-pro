-- Ensure admin users have full system access across all tables
-- This migration enhances RLS policies to support comprehensive admin dashboard functionality

-- First, let's ensure we have proper admin access policies for all critical tables

-- Enhanced admin access for profiles table
DROP POLICY IF EXISTS "admin_access_all_profiles" ON public.profiles;
CREATE POLICY "admin_access_all_profiles" 
ON public.profiles 
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Enhanced admin access for payments table  
DROP POLICY IF EXISTS "admin_access_all_payments" ON public.payments;
CREATE POLICY "admin_access_all_payments" 
ON public.payments 
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Enhanced admin access for subscribers table
DROP POLICY IF EXISTS "admin_access_all_subscribers" ON public.subscribers;
CREATE POLICY "admin_access_all_subscribers" 
ON public.subscribers 
FOR ALL
TO authenticated
USING (
  ((auth.uid() = user_id) OR (email = auth.email())) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  ((auth.uid() = user_id) OR (email = auth.email())) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Enhanced admin access for analytics_data table
DROP POLICY IF EXISTS "admin_access_all_analytics" ON public.analytics_data;
CREATE POLICY "admin_access_all_analytics" 
ON public.analytics_data 
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Enhanced admin access for notifications table
DROP POLICY IF EXISTS "admin_access_all_notifications" ON public.notifications;
CREATE POLICY "admin_access_all_notifications" 
ON public.notifications 
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Enhanced admin access for documents table
DROP POLICY IF EXISTS "admin_access_all_documents" ON public.documents;
CREATE POLICY "admin_access_all_documents" 
ON public.documents 
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Enhanced admin access for compliance_checks table
DROP POLICY IF EXISTS "admin_access_all_compliance" ON public.compliance_checks;
CREATE POLICY "admin_access_all_compliance" 
ON public.compliance_checks 
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Enhanced admin access for cost_projections table
DROP POLICY IF EXISTS "admin_access_all_cost_projections" ON public.cost_projections;
CREATE POLICY "admin_access_all_cost_projections" 
ON public.cost_projections 
FOR ALL
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ))
);

-- Create function to get system-wide statistics (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_system_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_entities BIGINT,
  total_payments BIGINT,
  total_revenue NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.entities) as total_entities,
    (SELECT COUNT(*) FROM public.payments) as total_payments,
    (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'paid') as total_revenue
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  );
$$;