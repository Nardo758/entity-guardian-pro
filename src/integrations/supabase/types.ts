export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_category: string
          action_type: string
          admin_user_id: string
          created_at: string | null
          description: string
          id: string
          ip_address: unknown
          metadata: Json | null
          severity: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_category: string
          action_type: string
          admin_user_id: string
          created_at?: string | null
          description: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_category?: string
          action_type?: string
          admin_user_id?: string
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          severity?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      "business _owners": {
        Row: {
          company_name: string | null
          company_size: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ip_reputation: {
        Row: {
          blocked_until: string | null
          created_at: string
          failed_auth_attempts: number | null
          first_seen_at: string
          id: string
          ip_address: unknown
          last_seen_at: string
          last_violation_at: string | null
          metadata: Json | null
          rate_limit_violations: number | null
          reputation_score: number
          risk_level: string | null
          suspicious_patterns: number | null
          total_requests: number | null
          updated_at: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          failed_auth_attempts?: number | null
          first_seen_at?: string
          id?: string
          ip_address: unknown
          last_seen_at?: string
          last_violation_at?: string | null
          metadata?: Json | null
          rate_limit_violations?: number | null
          reputation_score?: number
          risk_level?: string | null
          suspicious_patterns?: number | null
          total_requests?: number | null
          updated_at?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          failed_auth_attempts?: number | null
          first_seen_at?: string
          id?: string
          ip_address?: unknown
          last_seen_at?: string
          last_violation_at?: string | null
          metadata?: Json | null
          rate_limit_violations?: number | null
          reputation_score?: number
          risk_level?: string | null
          suspicious_patterns?: number | null
          total_requests?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      mfa_recovery_codes: {
        Row: {
          code_hash: string
          created_at: string | null
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_recovery_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          id: string
          is_default: boolean
          stripe_payment_method_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          company_size: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          plan: string | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          company?: string | null
          company_size?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          plan?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          company?: string | null
          company_size?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          plan?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      security_report_config: {
        Row: {
          created_at: string
          created_by: string | null
          custom_html: string | null
          email_subject: string
          email_template: string
          id: string
          include_ip_reputation: boolean
          include_violations: boolean
          is_enabled: boolean
          name: string
          recipient_user_ids: string[]
          schedule_day: number | null
          schedule_time: string
          schedule_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_html?: string | null
          email_subject?: string
          email_template?: string
          id?: string
          include_ip_reputation?: boolean
          include_violations?: boolean
          is_enabled?: boolean
          name: string
          recipient_user_ids?: string[]
          schedule_day?: number | null
          schedule_time?: string
          schedule_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_html?: string | null
          email_subject?: string
          email_template?: string
          id?: string
          include_ip_reputation?: boolean
          include_violations?: boolean
          is_enabled?: boolean
          name?: string
          recipient_user_ids?: string[]
          schedule_day?: number | null
          schedule_time?: string
          schedule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_report_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      security_report_history: {
        Row: {
          config_id: string | null
          error_message: string | null
          executed_at: string
          failure_count: number
          id: string
          recipients_count: number
          report_type: string
          stats: Json | null
          success_count: number
        }
        Insert: {
          config_id?: string | null
          error_message?: string | null
          executed_at?: string
          failure_count?: number
          id?: string
          recipients_count?: number
          report_type: string
          stats?: Json | null
          success_count?: number
        }
        Update: {
          config_id?: string | null
          error_message?: string | null
          executed_at?: string
          failure_count?: number
          id?: string
          recipients_count?: number
          report_type?: string
          stats?: Json | null
          success_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "security_report_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "security_report_config"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      stripe_invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          currency: string
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_customer_id: string
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_due: number
          amount_paid: number
          created_at?: string
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status: string
          stripe_customer_id: string
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscribers: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          email: string
          entities_limit: number | null
          id: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean | null
          subscription_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email: string
          entities_limit?: number | null
          id?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string
          entities_limit?: number | null
          id?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount: number | null
          billing_cycle: string
          created_at: string
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          status: string
          stripe_subscription_id: string | null
          subscription_tier: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          billing_cycle: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at: string
          status: string
          stripe_subscription_id?: string | null
          subscription_tier: string
          user_id: string
        }
        Update: {
          amount?: number | null
          billing_cycle?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          status?: string
          stripe_subscription_id?: string | null
          subscription_tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "is_admin_v"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      is_admin_v: {
        Row: {
          is_admin: boolean | null
          user_id: string | null
        }
        Insert: {
          is_admin?: never
          user_id?: string | null
        }
        Update: {
          is_admin?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_ip_reputation: {
        Args: {
          p_failed_auth?: number
          p_ip_address: unknown
          p_rate_violations?: number
          p_suspicious?: number
        }
        Returns: {
          blocked_until: string
          reputation_score: number
          risk_level: string
        }[]
      }
      can_create_assignment_for_entity: {
        Args: { entity_uuid: string; user_uuid: string }
        Returns: boolean
      }
      cleanup_ip_reputation: { Args: never; Returns: number }
      generate_agent_invitation_token: { Args: never; Returns: string }
      generate_invitation_token: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_admin_subscriber_stats: {
        Args: never
        Returns: {
          active_subscribers: number
          mrr: number
          subscriber_growth_30d: number
          subscription_tiers: Json
          total_revenue: number
          total_subscribers: number
        }[]
      }
      get_admin_system_stats: {
        Args: never
        Returns: {
          total_entities: number
          total_payments: number
          total_revenue: number
          total_users: number
        }[]
      }
      get_agent_invitation_metrics: {
        Args: { owner_id: string }
        Returns: {
          accepted_count: number
          declined_count: number
          entities_with_agents: number
          pending_count: number
          total_sent: number
          unsent_count: number
        }[]
      }
      get_audit_log_stats: {
        Args: { p_days?: number }
        Returns: {
          actions_by_category: Json
          actions_by_severity: Json
          recent_critical_events: number
          top_admins: Json
          total_actions: number
        }[]
      }
      get_business_intelligence: {
        Args: never
        Returns: {
          churn_risk_indicators: Json
          customer_satisfaction_score: number
          feature_adoption_rates: Json
          seasonal_patterns: Json
          state_compliance_trends: Json
        }[]
      }
      get_current_user_admin_status: { Args: never; Returns: boolean }
      get_entity_analytics: {
        Args: never
        Returns: {
          avg_entities_per_customer: number
          entities_by_state: Json
          entities_by_type: Json
          entity_creation_rate_30d: number
          entity_deletion_rate_30d: number
          entity_lifecycle_metrics: Json
          geographic_heat_map: Json
          most_popular_entity_type: string
          most_popular_state: string
          total_entities: number
        }[]
      }
      get_financial_analytics: {
        Args: never
        Returns: {
          accounts_receivable_aging: Json
          agent_commission_tracking: Json
          agent_service_revenue: number
          arpu: number
          arr: number
          mrr: number
          outstanding_invoices: number
          payment_volume_30d: number
          revenue_by_tier: Json
          revenue_forecast: Json
          revenue_growth_rate: number
          total_revenue: number
        }[]
      }
      get_operational_analytics: {
        Args: never
        Returns: {
          api_usage_patterns: Json
          avg_processing_time_days: number
          compliance_completion_rate: number
          database_performance_metrics: Json
          document_processing_volume: number
          failed_renewals_30d: number
          response_times: Json
          security_incidents: number
          support_ticket_volume: number
          system_uptime_percentage: number
        }[]
      }
      get_secure_subscriber_data: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string
          subscribed: boolean
          subscription_end: string
          subscription_tier: string
          updated_at: string
          user_id: string
        }[]
      }
      get_unused_recovery_code_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_analytics: {
        Args: never
        Returns: {
          clv_by_segment: Json
          downgrade_rate: number
          entities_this_month: number
          geographic_distribution: Json
          revenue_concentration: Json
          total_entities: number
          total_users: number
          trial_to_paid_conversion: number
          upgrade_rate: number
          user_growth_30d: number
          user_growth_7d: number
          user_retention_rate: number
          users_by_role: Json
        }[]
      }
      get_user_team_role: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_invited_agent: {
        Args: { invitation_id: string; user_uuid: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action_category: string
          p_action_type: string
          p_description?: string
          p_metadata?: Json
          p_severity?: string
          p_target_user_id?: string
        }
        Returns: string
      }
      log_admin_operation: {
        Args: {
          operation_data?: Json
          operation_type: string
          target_user_id?: string
        }
        Returns: undefined
      }
      log_failed_admin_login: {
        Args: { p_email: string; p_ip_address?: string; p_reason?: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { event_data?: Json; event_type: string }
        Returns: undefined
      }
      log_security_violation: {
        Args: {
          details?: Json
          ip_address_param?: unknown
          user_id_param?: string
          violation_type: string
        }
        Returns: undefined
      }
      log_stripe_event: {
        Args: {
          p_event_data: Json
          p_event_type: string
          p_stripe_event_id: string
        }
        Returns: string
      }
      mark_event_processed: {
        Args: { p_error_message?: string; p_stripe_event_id: string }
        Returns: undefined
      }
      owns_assignment_agent: {
        Args: { assignment_id: string; user_uuid: string }
        Returns: boolean
      }
      owns_assignment_entity: {
        Args: { assignment_id: string; user_uuid: string }
        Returns: boolean
      }
      owns_invited_agent: {
        Args: { invitation_id: string; user_uuid: string }
        Returns: boolean
      }
      should_mask_profile_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      track_invitation_event: {
        Args: {
          event_type_param: string
          ip_address_param?: unknown
          metadata_param?: Json
          referral_uuid: string
          user_agent_param?: string
        }
        Returns: string
      }
      update_ip_reputation: {
        Args: { p_event_type: string; p_ip_address: unknown; p_metadata?: Json }
        Returns: {
          blocked_until: string
          reputation_score: number
          risk_level: string
          should_block: boolean
        }[]
      }
      update_subscriber_from_webhook: {
        Args: {
          p_cancel_at_period_end?: boolean
          p_current_period_end: string
          p_current_period_start: string
          p_stripe_customer_id: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
          p_subscription_status: string
        }
        Returns: string
      }
      user_has_team_permission: {
        Args: {
          required_role: Database["public"]["Enums"]["team_role"]
          team_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      user_is_admin: { Args: { user_uuid: string }; Returns: boolean }
      validate_admin_action: { Args: { action_name: string }; Returns: boolean }
      validate_payment_method_access: {
        Args: { method_user_id: string }
        Returns: boolean
      }
      validate_payment_method_owner: {
        Args: { method_user_id: string }
        Returns: boolean
      }
      validate_recovery_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "registered_agent"
      payment_processing_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "canceled"
      team_role: "owner" | "admin" | "manager" | "member"
      unified_user_role: "admin" | "registered_agent" | "entity_owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "user", "registered_agent"],
      payment_processing_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "canceled",
      ],
      team_role: ["owner", "admin", "manager", "member"],
      unified_user_role: ["admin", "registered_agent", "entity_owner"],
    },
  },
} as const
