export interface UserAnalytics {
  total_users: number;
  users_by_role: Record<string, number>;
  user_growth_30d: number;
  user_growth_7d: number;
  total_entities: number;
  entities_this_month: number;
  geographic_distribution: Record<string, number>;
  user_retention_rate: number;
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
}

export interface EntityAnalytics {
  total_entities: number;
  entities_by_type: Record<string, number>;
  entities_by_state: Record<string, number>;
  avg_entities_per_customer: number;
  entity_creation_rate_30d: number;
  most_popular_entity_type: string;
  most_popular_state: string;
}

export interface OperationalAnalytics {
  compliance_completion_rate: number;
  avg_processing_time_days: number;
  failed_renewals_30d: number;
  document_processing_volume: number;
  support_ticket_volume: number;
  system_uptime_percentage: number;
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