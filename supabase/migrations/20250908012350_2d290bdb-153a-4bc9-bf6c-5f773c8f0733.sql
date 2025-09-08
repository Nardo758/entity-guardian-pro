-- Phase 1: Unify Role System and Add Admin Features

-- First, let's add missing admin functionality tables
CREATE TABLE IF NOT EXISTS admin_user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'suspend', 'activate', 'delete', 'edit', 'role_change'
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_user_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can access admin actions
CREATE POLICY "Admins can access all admin actions" ON admin_user_actions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Financial adjustments table for admin financial controls
CREATE TABLE IF NOT EXISTS financial_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  adjustment_type TEXT NOT NULL, -- 'refund', 'credit', 'debit', 'fee_waiver'
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  reason TEXT NOT NULL,
  reference_payment_id UUID,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'processed', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE financial_adjustments ENABLE ROW LEVEL SECURITY;

-- Only admins can create and manage financial adjustments
CREATE POLICY "Admins can manage financial adjustments" ON financial_adjustments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Users can view their own adjustments
CREATE POLICY "Users can view own financial adjustments" ON financial_adjustments
FOR SELECT USING (auth.uid() = user_id);

-- System monitoring and health table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  status TEXT DEFAULT 'normal', -- 'normal', 'warning', 'critical'
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

-- Only admins can access system health metrics
CREATE POLICY "Admins can access system health metrics" ON system_health_metrics
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address INET,
  user_agent TEXT,
  api_key_id UUID,
  rate_limit_exceeded BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can access API usage logs
CREATE POLICY "Admins can access API usage logs" ON api_usage_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- User suspension/status tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'; -- 'active', 'suspended', 'pending', 'deactivated'

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS suspended_by UUID;

-- Update triggers for tracking changes
CREATE OR REPLACE FUNCTION log_admin_user_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile changes made by admins
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    -- Check if the user making the change is an admin
    IF EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
    ) THEN
      INSERT INTO admin_user_actions (
        admin_user_id,
        target_user_id,
        action_type,
        previous_value,
        new_value,
        reason
      ) VALUES (
        auth.uid(),
        NEW.user_id,
        CASE 
          WHEN OLD.account_status != NEW.account_status THEN 'status_change'
          WHEN OLD.user_type != NEW.user_type THEN 'role_change'
          ELSE 'profile_edit'
        END,
        to_jsonb(OLD),
        to_jsonb(NEW),
        COALESCE(NEW.suspension_reason, 'Admin profile update')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for profile changes
DROP TRIGGER IF EXISTS log_profile_admin_changes ON profiles;
CREATE TRIGGER log_profile_admin_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_user_action();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_user_actions_admin_user_id ON admin_user_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_actions_target_user_id ON admin_user_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_actions_created_at ON admin_user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_financial_adjustments_user_id ON financial_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_adjustments_admin_id ON financial_adjustments(admin_id);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_recorded_at ON system_health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- Update updated_at triggers
CREATE TRIGGER update_admin_user_actions_updated_at
  BEFORE UPDATE ON admin_user_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_adjustments_updated_at
  BEFORE UPDATE ON financial_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();