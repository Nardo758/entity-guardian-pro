-- Create comprehensive admin analytics functions (corrected)

-- User & Account Analytics Function
CREATE OR REPLACE FUNCTION public.get_user_analytics()
RETURNS TABLE(
  total_users bigint,
  users_by_role jsonb,
  user_growth_30d bigint,
  user_growth_7d bigint,
  total_entities bigint,
  entities_this_month bigint,
  geographic_distribution jsonb,
  user_retention_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_stats AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as growth_30d,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as growth_7d
    FROM public.profiles
  ),
  role_stats AS (
    SELECT 
      jsonb_object_agg(
        COALESCE(user_type, 'owner'), 
        count
      ) as users_by_role
    FROM (
      SELECT 
        user_type,
        COUNT(*) as count
      FROM public.profiles 
      GROUP BY user_type
    ) role_counts
  ),
  entity_stats AS (
    SELECT 
      COUNT(*) as total_entities,
      COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as entities_this_month
    FROM public.entities
  ),
  geo_stats AS (
    SELECT 
      jsonb_object_agg(state, count) as geographic_distribution
    FROM (
      SELECT 
        state,
        COUNT(*) as count
      FROM public.entities 
      GROUP BY state
      ORDER BY count DESC
      LIMIT 20
    ) geo_counts
  )
  SELECT 
    us.total_users,
    rs.users_by_role,
    us.growth_30d,
    us.growth_7d,
    es.total_entities,
    es.entities_this_month,
    gs.geographic_distribution,
    CASE 
      WHEN us.total_users > 0 THEN 
        ROUND((us.total_users - us.growth_30d)::numeric / us.total_users::numeric * 100, 2)
      ELSE 0 
    END as user_retention_rate
  FROM user_stats us
  CROSS JOIN role_stats rs
  CROSS JOIN entity_stats es
  CROSS JOIN geo_stats gs;
$$;

-- Financial Performance Analytics Function (Fixed)
CREATE OR REPLACE FUNCTION public.get_financial_analytics()
RETURNS TABLE(
  total_revenue numeric,
  mrr numeric,
  arr numeric,
  revenue_by_tier jsonb,
  payment_volume_30d numeric,
  outstanding_invoices numeric,
  arpu numeric,
  revenue_growth_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH payment_stats AS (
    SELECT 
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'paid' AND created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as revenue_30d,
      SUM(CASE WHEN status = 'paid' AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as revenue_prev_30d,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as outstanding_invoices,
      COUNT(DISTINCT user_id) as paying_users
    FROM public.payments
  ),
  tier_revenue AS (
    SELECT 
      jsonb_object_agg(
        COALESCE(tier_counts.plan, 'starter'), 
        tier_counts.revenue
      ) as revenue_by_tier
    FROM (
      SELECT 
        pr.plan,
        SUM(pa.amount) as revenue
      FROM public.payments pa
      JOIN public.profiles pr ON pa.user_id = pr.user_id
      WHERE pa.status = 'paid'
      GROUP BY pr.plan
    ) tier_counts
  ),
  subscription_stats AS (
    SELECT 
      COUNT(*) as total_subscribers,
      AVG(CASE WHEN subscription_tier = 'pro' THEN 99 
               WHEN subscription_tier = 'premium' THEN 199 
               ELSE 29 END) as avg_subscription_value
    FROM public.subscribers 
    WHERE subscribed = true
  )
  SELECT 
    COALESCE(ps.total_revenue, 0) as total_revenue,
    COALESCE(ss.avg_subscription_value, 0) as mrr,
    COALESCE(ss.avg_subscription_value * 12, 0) as arr,
    COALESCE(tr.revenue_by_tier, '{}'::jsonb) as revenue_by_tier,
    COALESCE(ps.revenue_30d, 0) as payment_volume_30d,
    COALESCE(ps.outstanding_invoices, 0) as outstanding_invoices,
    CASE 
      WHEN ps.paying_users > 0 THEN ps.total_revenue / ps.paying_users 
      ELSE 0 
    END as arpu,
    CASE 
      WHEN ps.revenue_prev_30d > 0 THEN 
        ROUND(((ps.revenue_30d - ps.revenue_prev_30d) / ps.revenue_prev_30d * 100), 2)
      ELSE 0 
    END as revenue_growth_rate
  FROM payment_stats ps
  CROSS JOIN tier_revenue tr
  CROSS JOIN subscription_stats ss;
$$;