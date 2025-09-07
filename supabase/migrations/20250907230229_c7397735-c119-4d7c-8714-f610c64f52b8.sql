-- Fix security warning: Function Search Path Mutable
-- Update the admin system stats function to have immutable search_path

CREATE OR REPLACE FUNCTION public.get_admin_system_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_entities BIGINT,
  total_payments BIGINT,
  total_revenue NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
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