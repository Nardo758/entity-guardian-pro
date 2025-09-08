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
      agent_documents: {
        Row: {
          agent_id: string
          created_at: string
          document_type: string
          entity_id: string
          entity_owner_id: string
          file_name: string
          file_path: string
          file_size: number
          forwarded_date: string | null
          forwarding_method: string | null
          id: string
          metadata: Json | null
          notes: string | null
          received_date: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          document_type: string
          entity_id: string
          entity_owner_id: string
          file_name: string
          file_path: string
          file_size: number
          forwarded_date?: string | null
          forwarding_method?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          received_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          document_type?: string
          entity_id?: string
          entity_owner_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          forwarded_date?: string | null
          forwarding_method?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          received_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_invitations: {
        Row: {
          agent_email: string
          agent_id: string | null
          created_at: string
          entity_id: string
          entity_owner_id: string
          expires_at: string
          id: string
          message: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          agent_email: string
          agent_id?: string | null
          created_at?: string
          entity_id: string
          entity_owner_id: string
          expires_at?: string
          id?: string
          message?: string | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          agent_email?: string
          agent_id?: string | null
          created_at?: string
          entity_id?: string
          entity_owner_id?: string
          expires_at?: string
          id?: string
          message?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_invitations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invitations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_invoices: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          due_date: string
          entity_id: string
          entity_owner_id: string
          id: string
          invoice_number: string
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          service_period_end: string
          service_period_start: string
          services_provided: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          due_date: string
          entity_id: string
          entity_owner_id: string
          id?: string
          invoice_number: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          service_period_end: string
          service_period_start: string
          services_provided?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          due_date?: string
          entity_id?: string
          entity_owner_id?: string
          id?: string
          invoice_number?: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          service_period_end?: string
          service_period_start?: string
          services_provided?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          bio: string | null
          company_name: string | null
          contact_email: string | null
          created_at: string
          id: string
          is_available: boolean
          price_per_entity: number
          states: string[]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          price_per_entity?: number
          states?: string[]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          company_name?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          price_per_entity?: number
          states?: string[]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      analytics_data: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          metadata: Json | null
          metric_date: string
          metric_name: string
          metric_type: string
          metric_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          metric_date: string
          metric_name: string
          metric_type: string
          metric_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          check_name: string
          check_type: string
          completion_date: string | null
          created_at: string
          due_date: string | null
          entity_id: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_name: string
          check_type: string
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          entity_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_name?: string
          check_type?: string
          completion_date?: string | null
          created_at?: string
          due_date?: string | null
          entity_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_deadlines: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          created_at: string
          deadline_type: string
          description: string | null
          due_date: string
          entity_id: string
          filing_fee: number | null
          id: string
          metadata: Json | null
          reminder_sent: boolean | null
          state: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          deadline_type: string
          description?: string | null
          due_date: string
          entity_id: string
          filing_fee?: number | null
          id?: string
          metadata?: Json | null
          reminder_sent?: boolean | null
          state: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          deadline_type?: string
          description?: string | null
          due_date?: string
          entity_id?: string
          filing_fee?: number | null
          id?: string
          metadata?: Json | null
          reminder_sent?: boolean | null
          state?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_projections: {
        Row: {
          actual_amount: number | null
          created_at: string
          entity_id: string | null
          id: string
          metadata: Json | null
          projected_amount: number
          projection_date: string
          projection_name: string
          projection_type: string
          updated_at: string
          user_id: string
          variance: number | null
        }
        Insert: {
          actual_amount?: number | null
          created_at?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          projected_amount: number
          projection_date: string
          projection_name: string
          projection_type: string
          updated_at?: string
          user_id: string
          variance?: number | null
        }
        Update: {
          actual_amount?: number | null
          created_at?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          projected_amount?: number
          projection_date?: string
          projection_name?: string
          projection_type?: string
          updated_at?: string
          user_id?: string
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_projections_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          entity_id: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          entity_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string
          formation_date: string
          id: string
          independent_director_email: string | null
          independent_director_fee: number | null
          independent_director_fee_due_date: string | null
          independent_director_name: string | null
          independent_director_phone: string | null
          name: string
          registered_agent_email: string
          registered_agent_fee: number
          registered_agent_fee_due_date: string | null
          registered_agent_name: string
          registered_agent_phone: string
          state: string
          team_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          formation_date: string
          id?: string
          independent_director_email?: string | null
          independent_director_fee?: number | null
          independent_director_fee_due_date?: string | null
          independent_director_name?: string | null
          independent_director_phone?: string | null
          name: string
          registered_agent_email: string
          registered_agent_fee: number
          registered_agent_fee_due_date?: string | null
          registered_agent_name: string
          registered_agent_phone: string
          state: string
          team_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          formation_date?: string
          id?: string
          independent_director_email?: string | null
          independent_director_fee?: number | null
          independent_director_fee_due_date?: string | null
          independent_director_name?: string | null
          independent_director_phone?: string | null
          name?: string
          registered_agent_email?: string
          registered_agent_fee?: number
          registered_agent_fee_due_date?: string | null
          registered_agent_name?: string
          registered_agent_phone?: string
          state?: string
          team_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entity_agent_assignments: {
        Row: {
          agent_id: string
          created_at: string
          entity_id: string
          expires_at: string
          id: string
          invited_at: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          entity_id: string
          expires_at?: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          entity_id?: string
          expires_at?: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_agent_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_agent_assignments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          notification_types: string[] | null
          reminder_days_before: number[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notification_types?: string[] | null
          reminder_days_before?: number[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notification_types?: string[] | null
          reminder_days_before?: number[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          email_sent: boolean | null
          entity_id: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string | null
          read: boolean
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          timestamp: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          entity_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type?: string | null
          read?: boolean
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          timestamp: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          entity_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string | null
          read?: boolean
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      officers: {
        Row: {
          address: string | null
          appointment_date: string | null
          created_at: string
          email: string | null
          entity_id: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          appointment_date?: string | null
          created_at?: string
          email?: string | null
          entity_id: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          appointment_date?: string | null
          created_at?: string
          email?: string | null
          entity_id?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otps: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          otp_code: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          otp_code: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          otp_code?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          expiry_date: string | null
          id: string
          is_default: boolean
          last_four: string | null
          name: string
          routing_number: string | null
          stripe_payment_method_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_default?: boolean
          last_four?: string | null
          name: string
          routing_number?: string | null
          stripe_payment_method_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_default?: boolean
          last_four?: string | null
          name?: string
          routing_number?: string | null
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          entity_name: string
          id: string
          paid_date: string | null
          payment_method: string | null
          processing_fee: number | null
          processing_status:
            | Database["public"]["Enums"]["payment_processing_status"]
            | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          entity_name: string
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          processing_fee?: number | null
          processing_status?:
            | Database["public"]["Enums"]["payment_processing_status"]
            | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          entity_name?: string
          id?: string
          paid_date?: string | null
          payment_method?: string | null
          processing_fee?: number | null
          processing_status?:
            | Database["public"]["Enums"]["payment_processing_status"]
            | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          company_size: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          plan: string | null
          unified_role: Database["public"]["Enums"]["unified_user_role"] | null
          updated_at: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          company?: string | null
          company_size?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          plan?: string | null
          unified_role?: Database["public"]["Enums"]["unified_user_role"] | null
          updated_at?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          company?: string | null
          company_size?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          plan?: string | null
          unified_role?: Database["public"]["Enums"]["unified_user_role"] | null
          updated_at?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          message: string
          metadata: Json | null
          notification_type: string
          processed: boolean | null
          processed_at: string | null
          retry_count: number | null
          scheduled_for: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message: string
          metadata?: Json | null
          notification_type: string
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_assignment_for_entity: {
        Args: { entity_uuid: string; user_uuid: string }
        Returns: boolean
      }
      generate_agent_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_system_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_entities: number
          total_payments: number
          total_revenue: number
          total_users: number
        }[]
      }
      get_business_intelligence: {
        Args: Record<PropertyKey, never>
        Returns: {
          churn_risk_indicators: Json
          customer_satisfaction_score: number
          feature_adoption_rates: Json
          seasonal_patterns: Json
          state_compliance_trends: Json
        }[]
      }
      get_current_user_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_entity_analytics: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
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
      get_user_analytics: {
        Args: Record<PropertyKey, never>
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
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_invited_agent: {
        Args: { invitation_id: string; user_uuid: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { event_data?: Json; event_type: string }
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
      user_has_team_permission: {
        Args: {
          required_role: Database["public"]["Enums"]["team_role"]
          team_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      user_is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      validate_payment_method_access: {
        Args: { method_user_id: string }
        Returns: boolean
      }
      validate_payment_method_owner: {
        Args: { method_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
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
      app_role: ["admin", "manager", "user"],
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
