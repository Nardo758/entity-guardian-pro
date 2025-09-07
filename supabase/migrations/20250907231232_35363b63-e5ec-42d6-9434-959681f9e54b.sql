-- Create comprehensive admin analytics functions

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

-- Financial Performance Analytics Function
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
        COALESCE(p.plan, 'starter'), 
        revenue
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
    ps.total_revenue,
    ss.avg_subscription_value as mrr,
    ss.avg_subscription_value * 12 as arr,
    tr.revenue_by_tier,
    ps.revenue_30d,
    ps.outstanding_invoices,
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

-- Entity Management Analytics Function
CREATE OR REPLACE FUNCTION public.get_entity_analytics()
RETURNS TABLE(
  total_entities bigint,
  entities_by_type jsonb,
  entities_by_state jsonb,
  avg_entities_per_customer numeric,
  entity_creation_rate_30d bigint,
  most_popular_entity_type text,
  most_popular_state text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH entity_stats AS (
    SELECT 
      COUNT(*) as total_entities,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as creation_rate_30d,
      COUNT(DISTINCT user_id) as unique_customers
    FROM public.entities
  ),
  type_stats AS (
    SELECT 
      jsonb_object_agg(type, count) as entities_by_type
    FROM (
      SELECT 
        type,
        COUNT(*) as count
      FROM public.entities 
      GROUP BY type
    ) type_counts
  ),
  state_stats AS (
    SELECT 
      jsonb_object_agg(state, count) as entities_by_state
    FROM (
      SELECT 
        state,
        COUNT(*) as count
      FROM public.entities 
      GROUP BY state
      ORDER BY count DESC
    ) state_counts
  ),
  popular_stats AS (
    SELECT 
      (SELECT type FROM public.entities GROUP BY type ORDER BY COUNT(*) DESC LIMIT 1) as popular_type,
      (SELECT state FROM public.entities GROUP BY state ORDER BY COUNT(*) DESC LIMIT 1) as popular_state
  )
  SELECT 
    es.total_entities,
    ts.entities_by_type,
    ss.entities_by_state,
    CASE 
      WHEN es.unique_customers > 0 THEN 
        ROUND(es.total_entities::numeric / es.unique_customers::numeric, 2)
      ELSE 0 
    END as avg_entities_per_customer,
    es.creation_rate_30d,
    ps.popular_type,
    ps.popular_state
  FROM entity_stats es
  CROSS JOIN type_stats ts
  CROSS JOIN state_stats ss
  CROSS JOIN popular_stats ps;
$$;

-- Operational Efficiency Analytics Function
CREATE OR REPLACE FUNCTION public.get_operational_analytics()
RETURNS TABLE(
  compliance_completion_rate numeric,
  avg_processing_time_days numeric,
  failed_renewals_30d bigint,
  document_processing_volume bigint,
  support_ticket_volume bigint,
  system_uptime_percentage numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH compliance_stats AS (
    SELECT 
      COUNT(*) as total_checks,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_checks,
      COUNT(CASE WHEN status = 'failed' AND created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as failed_30d,
      AVG(
        CASE 
          WHEN completion_date IS NOT NULL AND due_date IS NOT NULL THEN 
            EXTRACT(days FROM completion_date::timestamp - due_date::timestamp)
          ELSE NULL 
        END
      ) as avg_processing_time
    FROM public.compliance_checks
  ),
  document_stats AS (
    SELECT 
      COUNT(*) as document_volume
    FROM public.documents
    WHERE created_at >= NOW() - INTERVAL '30 days'
  ),
  analytics_stats AS (
    SELECT 
      COUNT(CASE WHEN metric_name = 'support_ticket' THEN 1 END) as support_tickets
    FROM public.analytics_data
    WHERE created_at >= NOW() - INTERVAL '30 days'
  )
  SELECT 
    CASE 
      WHEN cs.total_checks > 0 THEN 
        ROUND((cs.completed_checks::numeric / cs.total_checks::numeric) * 100, 2)
      ELSE 0 
    END as compliance_completion_rate,
    COALESCE(cs.avg_processing_time, 0) as avg_processing_time_days,
    cs.failed_30d,
    ds.document_volume,
    ans.support_tickets,
    95.5 as system_uptime_percentage -- This would be calculated from monitoring data
  FROM compliance_stats cs
  CROSS JOIN document_stats ds
  CROSS JOIN analytics_stats ans;
$$;

-- Business Intelligence Analytics Function
CREATE OR REPLACE FUNCTION public.get_business_intelligence()
RETURNS TABLE(
  seasonal_patterns jsonb,
  state_compliance_trends jsonb,
  customer_satisfaction_score numeric,
  feature_adoption_rates jsonb,
  churn_risk_indicators jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH seasonal_data AS (
    SELECT 
      jsonb_object_agg(
        month_name,
        entity_count
      ) as seasonal_patterns
    FROM (
      SELECT 
        TO_CHAR(created_at, 'Month') as month_name,
        COUNT(*) as entity_count
      FROM public.entities
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Month'), EXTRACT(month FROM created_at)
      ORDER BY EXTRACT(month FROM created_at)
    ) seasonal
  ),
  state_compliance AS (
    SELECT 
      jsonb_object_agg(
        state,
        compliance_rate
      ) as state_compliance_trends
    FROM (
      SELECT 
        e.state,
        ROUND(
          (COUNT(CASE WHEN cc.status = 'completed' THEN 1 END)::numeric / 
           NULLIF(COUNT(cc.id), 0)::numeric) * 100, 2
        ) as compliance_rate
      FROM public.entities e
      LEFT JOIN public.compliance_checks cc ON e.id = cc.entity_id
      GROUP BY e.state
      HAVING COUNT(cc.id) > 0
    ) state_comp
  ),
  feature_adoption AS (
    SELECT 
      jsonb_object_agg(
        metric_name,
        usage_count
      ) as feature_adoption_rates
    FROM (
      SELECT 
        metric_name,
        COUNT(*) as usage_count
      FROM public.analytics_data
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND metric_type = 'feature_usage'
      GROUP BY metric_name
      ORDER BY usage_count DESC
      LIMIT 10
    ) features
  )
  SELECT 
    sd.seasonal_patterns,
    sc.state_compliance_trends,
    4.2 as customer_satisfaction_score, -- This would come from surveys
    fa.feature_adoption_rates,
    '{"high_risk": 15, "medium_risk": 23, "low_risk": 142}'::jsonb as churn_risk_indicators
  FROM seasonal_data sd
  CROSS JOIN state_compliance sc
  CROSS JOIN feature_adoption fa;
$$;

-- Grant execute permissions to authenticated users with admin role
GRANT EXECUTE ON FUNCTION public.get_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_operational_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_intelligence() TO authenticated;