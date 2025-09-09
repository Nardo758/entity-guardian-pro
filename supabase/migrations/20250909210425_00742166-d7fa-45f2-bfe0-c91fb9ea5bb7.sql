-- Drop existing function and create secure admin function for subscriber statistics
DROP FUNCTION IF EXISTS public.get_admin_subscriber_stats();

CREATE OR REPLACE FUNCTION public.get_admin_subscriber_stats()
RETURNS TABLE(
  total_subscribers bigint,
  active_subscribers bigint,
  subscription_tiers jsonb,
  subscriber_growth_30d bigint,
  total_revenue numeric,
  mrr numeric
) AS $$
BEGIN
  -- Validate admin access
  PERFORM public.validate_admin_action('get_admin_subscriber_stats');
  
  -- Log admin access to subscriber stats
  PERFORM public.log_security_event(
    'admin_subscriber_stats_access',
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'timestamp', now()
    )
  );
  
  RETURN QUERY
  WITH subscriber_stats AS (
    SELECT 
      COUNT(*) as total_subs,
      COUNT(CASE WHEN subscribed = true THEN 1 END) as active_subs,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as growth_30d
    FROM public.subscribers
  ),
  tier_stats AS (
    SELECT 
      jsonb_object_agg(
        COALESCE(subscription_tier, 'starter'), 
        count
      ) as tier_distribution
    FROM (
      SELECT 
        subscription_tier,
        COUNT(*) as count
      FROM public.subscribers 
      WHERE subscribed = true
      GROUP BY subscription_tier
    ) tier_counts
  ),
  revenue_stats AS (
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_rev,
      COALESCE(AVG(CASE WHEN status = 'paid' AND created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE NULL END), 0) as monthly_rev
    FROM public.payments
  )
  SELECT 
    ss.total_subs,
    ss.active_subs,
    ts.tier_distribution,
    ss.growth_30d,
    rs.total_rev / 100.0, -- Convert from cents
    rs.monthly_rev / 100.0 -- Convert from cents
  FROM subscriber_stats ss
  CROSS JOIN tier_stats ts
  CROSS JOIN revenue_stats rs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;