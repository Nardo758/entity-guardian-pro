export interface Entity {
  id: string;
  user_id: string;
  team_id?: string;
  name: string;
  type: 'sole_proprietorship' | 'partnership' | 'llc' | 'c_corp' | 's_corp';
  state: string;
  formation_date: string;
  registered_agent_name: string;
  registered_agent_email: string;
  registered_agent_phone: string;
  registered_agent_fee: number;
  registered_agent_fee_due_date?: string;
  independent_director_name?: string;
  independent_director_email?: string;
  independent_director_phone?: string;
  independent_director_fee?: number;
  independent_director_fee_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  entity_name: string;
  type: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'scheduled';
  payment_method: string | null;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: string;
  stripe_payment_method_id: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  entity_id?: string;
  type: 'payment_due' | 'renewal_reminder' | 'compliance_check';
  notification_type: 'in_app' | 'email' | 'both';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  scheduled_for?: string;
  sent_at?: string;
  email_sent: boolean;
  retry_count: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  reminder_days_before: number[];
  notification_types: string[];
  created_at: string;
  updated_at: string;
}

export interface ScheduledNotification {
  id: string;
  user_id: string;
  entity_id?: string;
  notification_type: string;
  title: string;
  message: string;
  scheduled_for: string;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  entity_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  description?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsData {
  id: string;
  user_id: string;
  entity_id?: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_date: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ComplianceCheck {
  id: string;
  user_id: string;
  entity_id?: string;
  check_type: string;
  check_name: string;
  status: 'pending' | 'completed' | 'overdue' | 'failed';
  due_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CostProjection {
  id: string;
  user_id: string;
  entity_id?: string;
  projection_type: string;
  projection_name: string;
  projected_amount: number;
  projection_date: string;
  actual_amount?: number;
  variance?: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  subscription: {
    status: string;
    billingCycle: string;
    nextBilling: string;
    amount: number;
  };
}

export type TeamRole = 'owner' | 'admin' | 'manager' | 'member';

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  settings: Record<string, any>;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  invited_by?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  team?: Team;
  inviter?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}