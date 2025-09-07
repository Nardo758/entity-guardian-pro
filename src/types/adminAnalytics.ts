export interface UserAnalytics {
  total_users: number;
  users_by_role: Record<string, number>;
  user_growth_30d: number;
  user_growth_7d: number;
  total_entities: number;
  entities_this_month: number;
  geographic_distribution: Record<string, number>;
  user_retention_rate: number;
  trial_to_paid_conversion: number;
  upgrade_rate: number;
  downgrade_rate: number;
  clv_by_segment: Record<string, number>;
  revenue_concentration: Record<string, number>;
}

export interface FinancialAnalytics {
  total_revenue: number;
  mrr: number;
  arr: number;
  revenue_by_tier: Record<string, number>;
  payment_volume_30d: number;
  outstanding_invoices: number;
  arpu: number;
  revenue_growth_rate: number;
  agent_service_revenue: number;
  agent_commission_tracking: Record<string, number>;
  accounts_receivable_aging: Record<string, number>;
  revenue_forecast: Record<string, number>;
}

export interface EntityAnalytics {
  total_entities: number;
  entities_by_type: Record<string, number>;
  entities_by_state: Record<string, number>;
  avg_entities_per_customer: number;
  entity_creation_rate_30d: number;
  entity_deletion_rate_30d: number;
  most_popular_entity_type: string;
  most_popular_state: string;
  entity_lifecycle_metrics: Record<string, number>;
  geographic_heat_map: Record<string, number>;
}

export interface OperationalAnalytics {
  compliance_completion_rate: number;
  avg_processing_time_days: number;
  failed_renewals_30d: number;
  document_processing_volume: number;
  support_ticket_volume: number;
  system_uptime_percentage: number;
  database_performance_metrics: Record<string, number>;
  api_usage_patterns: Record<string, number>;
  security_incidents: number;
  response_times: Record<string, number>;
}

export interface BusinessIntelligence {
  seasonal_patterns: Record<string, number>;
  state_compliance_trends: Record<string, number>;
  customer_satisfaction_score: number;
  feature_adoption_rates: Record<string, number>;
  churn_risk_indicators: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
  };
}

export interface AdminDashboardMetrics {
  userAnalytics: UserAnalytics | null;
  financialAnalytics: FinancialAnalytics | null;
  entityAnalytics: EntityAnalytics | null;
  operationalAnalytics: OperationalAnalytics | null;
  businessIntelligence: BusinessIntelligence | null;
}