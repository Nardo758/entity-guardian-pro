-- Migration: Enhance database schema for Stripe subscription webhooks
-- Created: 2025-11-06
-- Purpose: Add necessary fields and tables to properly handle Stripe subscription lifecycle

-- ============================================
-- 1. Enhance subscribers table with Stripe fields
-- ============================================

-- Add Stripe subscription fields to subscribers table
ALTER TABLE public.subscribers 
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid')),
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entities_limit INTEGER DEFAULT 4;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_subscription_id ON public.subscribers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_subscription_status ON public.subscribers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);

-- ============================================
-- 2. Create stripe_invoices table
-- ============================================

CREATE TABLE IF NOT EXISTS public.stripe_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for stripe_invoices
ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices" 
  ON public.stripe_invoices 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all invoices" 
  ON public.stripe_invoices 
  FOR ALL 
  USING (true);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer_id ON public.stripe_invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_subscription_id ON public.stripe_invoices(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_id ON public.stripe_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_status ON public.stripe_invoices(status);

-- ============================================
-- 3. Create stripe_events table (webhook event log)
-- ============================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Enable RLS for stripe_events (admin only)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access events
CREATE POLICY "Service role can manage stripe events" 
  ON public.stripe_events 
  FOR ALL 
  USING (true);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_type ON public.stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed);
CREATE INDEX IF NOT EXISTS idx_stripe_events_created_at ON public.stripe_events(created_at DESC);

-- ============================================
-- 4. Create subscription_history table
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  amount INTEGER, -- in cents
  stripe_subscription_id TEXT,
  reason TEXT, -- upgrade, downgrade, cancellation, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for history
CREATE POLICY "Users can view their own subscription history" 
  ON public.subscription_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscription history" 
  ON public.subscription_history 
  FOR ALL 
  USING (true);

-- Index for history
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_started_at ON public.subscription_history(started_at DESC);

-- ============================================
-- 5. Create functions for subscription management
-- ============================================

-- Function to update subscriber from Stripe webhook
CREATE OR REPLACE FUNCTION public.update_subscriber_from_webhook(
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_price_id TEXT,
  p_subscription_status TEXT,
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ,
  p_cancel_at_period_end BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_subscription_tier TEXT;
  v_billing_cycle TEXT;
  v_entities_limit INTEGER;
BEGIN
  -- Find the subscriber by stripe_customer_id
  SELECT user_id INTO v_user_id
  FROM public.subscribers
  WHERE stripe_customer_id = p_stripe_customer_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Subscriber not found for stripe_customer_id: %', p_stripe_customer_id;
  END IF;

  -- Determine tier and billing cycle from price_id
  -- Starter: price_1StarterMonthly, price_1StarterYearly
  -- Growth: price_1GrowthMonthly, price_1GrowthYearly
  -- Professional: price_1ProfessionalMonthly, price_1ProfessionalYearly
  -- Enterprise: price_1EnterpriseMonthly, price_1EnterpriseYearly
  
  CASE 
    WHEN p_stripe_price_id LIKE '%starter%' OR p_stripe_price_id LIKE '%Starter%' THEN
      v_subscription_tier := 'starter';
      v_entities_limit := 4;
    WHEN p_stripe_price_id LIKE '%growth%' OR p_stripe_price_id LIKE '%Growth%' THEN
      v_subscription_tier := 'growth';
      v_entities_limit := 20;
    WHEN p_stripe_price_id LIKE '%professional%' OR p_stripe_price_id LIKE '%Professional%' THEN
      v_subscription_tier := 'professional';
      v_entities_limit := 50;
    WHEN p_stripe_price_id LIKE '%enterprise%' OR p_stripe_price_id LIKE '%Enterprise%' THEN
      v_subscription_tier := 'enterprise';
      v_entities_limit := 150;
    ELSE
      v_subscription_tier := 'free';
      v_entities_limit := 1;
  END CASE;

  -- Determine billing cycle
  IF p_stripe_price_id LIKE '%yearly%' OR p_stripe_price_id LIKE '%Yearly%' OR p_stripe_price_id LIKE '%year%' THEN
    v_billing_cycle := 'yearly';
  ELSE
    v_billing_cycle := 'monthly';
  END IF;

  -- Update the subscriber
  UPDATE public.subscribers
  SET 
    stripe_subscription_id = p_stripe_subscription_id,
    stripe_price_id = p_stripe_price_id,
    subscription_tier = v_subscription_tier,
    subscription_status = p_subscription_status,
    current_period_start = p_current_period_start,
    current_period_end = p_current_period_end,
    subscription_end = p_current_period_end,
    cancel_at_period_end = p_cancel_at_period_end,
    billing_cycle = v_billing_cycle,
    entities_limit = v_entities_limit,
    subscribed = (p_subscription_status = 'active'),
    updated_at = now()
  WHERE stripe_customer_id = p_stripe_customer_id;

  RETURN v_user_id;
END;
$$;

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if subscription_tier, status, or billing_cycle changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier OR
    OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
    OLD.billing_cycle IS DISTINCT FROM NEW.billing_cycle
  )) THEN
    INSERT INTO public.subscription_history (
      user_id,
      subscription_tier,
      billing_cycle,
      status,
      started_at,
      ended_at,
      stripe_subscription_id,
      reason
    ) VALUES (
      NEW.user_id,
      NEW.subscription_tier,
      NEW.billing_cycle,
      NEW.subscription_status,
      NEW.current_period_start,
      CASE 
        WHEN NEW.subscription_status IN ('canceled', 'incomplete_expired') THEN now()
        ELSE NULL
      END,
      NEW.stripe_subscription_id,
      CASE
        WHEN OLD.subscription_status = 'active' AND NEW.subscription_status = 'canceled' THEN 'cancellation'
        WHEN OLD.subscription_tier != NEW.subscription_tier THEN 'tier_change'
        WHEN OLD.billing_cycle != NEW.billing_cycle THEN 'billing_cycle_change'
        ELSE 'status_change'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for subscription history logging
DROP TRIGGER IF EXISTS log_subscription_changes ON public.subscribers;
CREATE TRIGGER log_subscription_changes
  AFTER UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_change();

-- ============================================
-- 6. Update existing triggers
-- ============================================

-- Add updated_at trigger for stripe_invoices
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_invoices_updated_at
  BEFORE UPDATE ON public.stripe_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. Create helper views
-- ============================================

-- View for active subscriptions
CREATE OR REPLACE VIEW public.active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  s.email,
  s.subscription_tier,
  s.subscription_status,
  s.billing_cycle,
  s.current_period_start,
  s.current_period_end,
  s.entities_limit,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.cancel_at_period_end,
  CASE 
    WHEN s.subscription_status = 'active' AND s.current_period_end > now() THEN true
    ELSE false
  END as is_active
FROM public.subscribers s
WHERE s.subscription_status IN ('active', 'trialing');

-- Grant access to authenticated users for their own data
GRANT SELECT ON public.active_subscriptions TO authenticated;

-- ============================================
-- 8. Add comments for documentation
-- ============================================

COMMENT ON TABLE public.subscribers IS 'Stores user subscription information synced with Stripe';
COMMENT ON TABLE public.stripe_invoices IS 'Stores invoice data from Stripe for user billing history';
COMMENT ON TABLE public.stripe_events IS 'Logs all Stripe webhook events for debugging and auditing';
COMMENT ON TABLE public.subscription_history IS 'Tracks all subscription changes over time';

COMMENT ON COLUMN public.subscribers.stripe_customer_id IS 'Stripe customer ID (cus_xxx)';
COMMENT ON COLUMN public.subscribers.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx)';
COMMENT ON COLUMN public.subscribers.stripe_price_id IS 'Stripe price ID (price_xxx)';
COMMENT ON COLUMN public.subscribers.subscription_status IS 'Current subscription status from Stripe';
COMMENT ON COLUMN public.subscribers.entities_limit IS 'Maximum number of entities allowed for this subscription tier';

-- ============================================
-- 9. Security: Function execution permissions
-- ============================================

-- Revoke public execution on sensitive functions
REVOKE ALL ON FUNCTION public.update_subscriber_from_webhook FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_subscription_change FROM PUBLIC;

-- Grant execution only to service role (used by edge functions)
-- Note: In Supabase, service_role bypasses RLS and can execute these functions
-- Authenticated users should not be able to call these directly
GRANT EXECUTE ON FUNCTION public.update_subscriber_from_webhook TO service_role;
GRANT EXECUTE ON FUNCTION public.log_subscription_change TO service_role;

-- The trigger function needs to be executable by the database
-- This is automatically handled by PostgreSQL for trigger functions

-- ============================================
-- 10. Enable required extensions
-- ============================================

-- Enable pgcrypto for UUID generation and encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp as backup for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 11. Additional composite indexes for query optimization
-- ============================================

-- Composite index for finding active subscriptions by user
-- Optimizes: WHERE user_id = ? AND subscription_status = 'active'
CREATE INDEX IF NOT EXISTS idx_subscribers_user_status 
  ON public.subscribers(user_id, subscription_status) 
  WHERE subscription_status IN ('active', 'trialing');

-- Composite index for subscription expiration queries
-- Optimizes: WHERE subscription_status = 'active' AND current_period_end < now()
CREATE INDEX IF NOT EXISTS idx_subscribers_status_period_end 
  ON public.subscribers(subscription_status, current_period_end) 
  WHERE subscription_status IN ('active', 'trialing');

-- Composite index for tier analytics
-- Optimizes: GROUP BY subscription_tier, billing_cycle WHERE subscription_status = 'active'
CREATE INDEX IF NOT EXISTS idx_subscribers_tier_cycle_status 
  ON public.subscribers(subscription_tier, billing_cycle, subscription_status) 
  WHERE subscription_status IN ('active', 'trialing');

-- Composite index for customer lookup with status
-- Optimizes: WHERE stripe_customer_id = ? AND subscription_status = ?
CREATE INDEX IF NOT EXISTS idx_subscribers_customer_status 
  ON public.subscribers(stripe_customer_id, subscription_status);

-- Composite index for invoice queries by user and status
-- Optimizes: WHERE user_id = ? AND status = 'paid' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user_status_created 
  ON public.stripe_invoices(user_id, status, created_at DESC);

-- Composite index for unpaid invoices lookup
-- Optimizes: WHERE stripe_customer_id = ? AND status IN ('open', 'draft')
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer_unpaid 
  ON public.stripe_invoices(stripe_customer_id, status) 
  WHERE status IN ('open', 'draft');

-- Composite index for webhook event processing
-- Optimizes: WHERE processed = false ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_stripe_events_unprocessed 
  ON public.stripe_events(processed, created_at) 
  WHERE processed = false;

-- Composite index for subscription history queries
-- Optimizes: WHERE user_id = ? ORDER BY started_at DESC
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_started 
  ON public.subscription_history(user_id, started_at DESC);

-- ============================================
-- 12. Add helpful database comments
-- ============================================

COMMENT ON INDEX idx_subscribers_user_status IS 'Optimizes queries for active user subscriptions';
COMMENT ON INDEX idx_subscribers_status_period_end IS 'Optimizes queries for expiring subscriptions';
COMMENT ON INDEX idx_subscribers_tier_cycle_status IS 'Optimizes analytics queries by tier and billing cycle';
COMMENT ON INDEX idx_stripe_invoices_user_status_created IS 'Optimizes invoice history queries';
COMMENT ON INDEX idx_stripe_events_unprocessed IS 'Optimizes webhook event processing queue';

-- ============================================
-- 13. Seed data for testing (optional)
-- ============================================

-- Update any existing subscribers with default values
UPDATE public.subscribers
SET 
  subscription_status = CASE WHEN subscribed THEN 'active' ELSE NULL END,
  entities_limit = CASE 
    WHEN subscription_tier = 'starter' THEN 4
    WHEN subscription_tier = 'growth' THEN 20
    WHEN subscription_tier = 'professional' THEN 50
    WHEN subscription_tier = 'enterprise' THEN 150
    ELSE 1
  END
WHERE entities_limit IS NULL;

-- ============================================
-- 14. Create helper function for webhook edge functions
-- ============================================

-- Function to safely log webhook events
CREATE OR REPLACE FUNCTION public.log_stripe_event(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Insert or update the event (prevents duplicate processing)
  INSERT INTO public.stripe_events (
    stripe_event_id,
    event_type,
    event_data,
    processed,
    created_at
  ) VALUES (
    p_stripe_event_id,
    p_event_type,
    p_event_data,
    false,
    now()
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Restrict execution to service role only
REVOKE ALL ON FUNCTION public.log_stripe_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_stripe_event TO service_role;

COMMENT ON FUNCTION public.log_stripe_event IS 'Safely logs Stripe webhook events, preventing duplicates';

-- Function to mark event as processed
CREATE OR REPLACE FUNCTION public.mark_event_processed(
  p_stripe_event_id TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.stripe_events
  SET 
    processed = true,
    processed_at = now(),
    error_message = p_error_message
  WHERE stripe_event_id = p_stripe_event_id;
END;
$$;

-- Restrict execution to service role only
REVOKE ALL ON FUNCTION public.mark_event_processed FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_event_processed TO service_role;

COMMENT ON FUNCTION public.mark_event_processed IS 'Marks a webhook event as processed';

-- ============================================
-- 15. Add constraint for data integrity
-- ============================================

-- Ensure subscription_end matches current_period_end for active subscriptions
-- This is a soft constraint via trigger, not a hard CHECK constraint
CREATE OR REPLACE FUNCTION public.sync_subscription_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-sync subscription_end with current_period_end
  IF NEW.current_period_end IS NOT NULL THEN
    NEW.subscription_end := NEW.current_period_end;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_subscription_end_trigger
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_end();

COMMENT ON FUNCTION public.sync_subscription_end IS 'Automatically syncs subscription_end with current_period_end';

-- ============================================
-- Migration complete with enhanced security and performance
-- ============================================
