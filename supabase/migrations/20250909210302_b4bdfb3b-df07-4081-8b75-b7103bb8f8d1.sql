-- Create admin function to safely get subscriber statistics
CREATE OR REPLACE FUNCTION public.get_admin_subscriber_stats()
RETURNS TABLE(
  total_subscribers bigint,
  active_subscriptions bigint,
  subscription_tiers jsonb
) AS $$
BEGIN
  -- Validate admin privileges
  PERFORM public.validate_admin_action('view_subscriber_stats');
  
  -- Log admin access to subscriber data
  PERFORM public.log_security_event(
    'admin_subscriber_stats_access',
    jsonb_build_object(
      'admin_user_id', auth.uid(),
      'timestamp', now()
    )
  );
  
  RETURN QUERY
  SELECT 
    COUNT(*) as total_subscribers,
    COUNT(CASE WHEN subscribed = true THEN 1 END) as active_subscriptions,
    jsonb_object_agg(
      COALESCE(subscription_tier, 'starter'), 
      tier_count
    ) as subscription_tiers
  FROM (
    SELECT 
      subscription_tier,
      COUNT(*) as tier_count
    FROM public.subscribers
    WHERE subscribed = true
    GROUP BY subscription_tier
  ) tier_stats
  CROSS JOIN (
    SELECT COUNT(*) as total_count FROM public.subscribers
  ) total_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;