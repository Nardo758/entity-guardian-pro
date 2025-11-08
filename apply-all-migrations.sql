-- ============================================
-- COMBINED MIGRATION SCRIPT
-- Apply this entire script to set up your database
-- ============================================

-- ============================================
-- STEP 1: Create base subscribers table
-- From: 20250828023502_5771c1bb-058d-49ba-9461-69bb6f72e35b.sql
-- ============================================

-- Create subscribers table to track subscription information
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscribers' AND policyname = 'select_own_subscription'
  ) THEN
    CREATE POLICY "select_own_subscription" ON public.subscribers
    FOR SELECT
    USING (user_id = auth.uid() OR email = auth.email());
  END IF;
END $$;

-- Create policy for edge functions to update subscription info
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscribers' AND policyname = 'update_own_subscription'
  ) THEN
    CREATE POLICY "update_own_subscription" ON public.subscribers
    FOR UPDATE
    USING (true);
  END IF;
END $$;

-- Create policy for edge functions to insert subscription info
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscribers' AND policyname = 'insert_subscription'
  ) THEN
    CREATE POLICY "insert_subscription" ON public.subscribers
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- STEP 2: Enhance subscribers table with Stripe fields
-- From: 20251106_stripe_subscription_tables.sql
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
-- STEP 3: Create stripe_invoices table
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

-- Create indexes for stripe_invoices
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_customer ON public.stripe_invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_subscription ON public.stripe_invoices(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_user ON public.stripe_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_status ON public.stripe_invoices(status);
CREATE INDEX IF NOT EXISTS idx_stripe_invoices_created ON public.stripe_invoices(created_at DESC);

-- Enable RLS on stripe_invoices
ALTER TABLE public.stripe_invoices ENABLE ROW LEVEL SECURITY;

-- Policies for stripe_invoices
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_invoices' AND policyname = 'select_own_invoices'
  ) THEN
    CREATE POLICY "select_own_invoices" ON public.stripe_invoices
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_invoices' AND policyname = 'service_role_all_invoices'
  ) THEN
    CREATE POLICY "service_role_all_invoices" ON public.stripe_invoices
    FOR ALL
    USING (true);
  END IF;
END $$;

-- ============================================
-- STEP 4: Create stripe_events table
-- ============================================

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for stripe_events
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_stripe_events_created ON public.stripe_events(created_at DESC);

-- Enable RLS on stripe_events
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- Policies for stripe_events (service_role only)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_events' AND policyname = 'service_role_all_events'
  ) THEN
    CREATE POLICY "service_role_all_events" ON public.stripe_events
    FOR ALL
    USING (true);
  END IF;
END $$;

-- ============================================
-- STEP 5: Create subscription_history table
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL,
  subscription_status TEXT NOT NULL,
  change_reason TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  entities_limit INTEGER,
  changed_from TEXT,
  changed_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for subscription_history
CREATE INDEX IF NOT EXISTS idx_subscription_history_user ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created ON public.subscription_history(created_at DESC);

-- Enable RLS on subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_history' AND policyname = 'select_own_history'
  ) THEN
    CREATE POLICY "select_own_history" ON public.subscription_history
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_history' AND policyname = 'service_role_all_history'
  ) THEN
    CREATE POLICY "service_role_all_history" ON public.subscription_history
    FOR ALL
    USING (true);
  END IF;
END $$;

-- ============================================
-- STEP 6: Create database functions
-- ============================================

-- Function to log Stripe events safely
CREATE OR REPLACE FUNCTION public.log_stripe_event(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_event_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO stripe_events (stripe_event_id, event_type, event_data)
  VALUES (p_stripe_event_id, p_event_type, p_event_data)
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Function to mark event as processed
CREATE OR REPLACE FUNCTION public.mark_event_processed(
  p_stripe_event_id TEXT,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stripe_events
  SET 
    processed = true,
    error_message = p_error_message
  WHERE stripe_event_id = p_stripe_event_id;
END;
$$;

-- Function to update subscriber from webhook data
CREATE OR REPLACE FUNCTION public.update_subscriber_from_webhook(
  p_stripe_customer_id TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_price_id TEXT,
  p_subscription_status TEXT,
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ,
  p_cancel_at_period_end BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tier TEXT;
  v_entities_limit INTEGER;
BEGIN
  -- Determine subscription tier and entities limit from price_id
  IF p_stripe_price_id LIKE '%starter%' OR p_stripe_price_id LIKE '%Starter%' THEN
    v_tier := 'starter';
    v_entities_limit := 4;
  ELSIF p_stripe_price_id LIKE '%growth%' OR p_stripe_price_id LIKE '%Growth%' THEN
    v_tier := 'growth';
    v_entities_limit := 20;
  ELSIF p_stripe_price_id LIKE '%professional%' OR p_stripe_price_id LIKE '%Professional%' THEN
    v_tier := 'professional';
    v_entities_limit := 50;
  ELSIF p_stripe_price_id LIKE '%enterprise%' OR p_stripe_price_id LIKE '%Enterprise%' THEN
    v_tier := 'enterprise';
    v_entities_limit := 150;
  ELSIF p_stripe_price_id LIKE '%unlimited%' THEN
    v_tier := 'unlimited';
    v_entities_limit := 999999;
  ELSE
    v_tier := 'starter';
    v_entities_limit := 4;
  END IF;

  -- Update or insert subscriber
  INSERT INTO subscribers (
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    subscription_tier,
    subscription_status,
    subscribed,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    entities_limit,
    updated_at
  )
  VALUES (
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    v_tier,
    p_subscription_status,
    (p_subscription_status = 'active'),
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    v_entities_limit,
    now()
  )
  ON CONFLICT (stripe_customer_id) 
  DO UPDATE SET
    stripe_subscription_id = p_stripe_subscription_id,
    stripe_price_id = p_stripe_price_id,
    subscription_tier = v_tier,
    subscription_status = p_subscription_status,
    subscribed = (p_subscription_status = 'active'),
    current_period_start = p_current_period_start,
    current_period_end = p_current_period_end,
    cancel_at_period_end = p_cancel_at_period_end,
    entities_limit = v_entities_limit,
    updated_at = now()
  RETURNING user_id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- Function to log subscription changes (trigger function)
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier OR
    OLD.subscription_status IS DISTINCT FROM NEW.subscription_status
  ) THEN
    INSERT INTO subscription_history (
      user_id,
      subscription_tier,
      subscription_status,
      stripe_subscription_id,
      stripe_price_id,
      entities_limit,
      changed_from,
      changed_to,
      change_reason
    )
    VALUES (
      NEW.user_id,
      NEW.subscription_tier,
      NEW.subscription_status,
      NEW.stripe_subscription_id,
      NEW.stripe_price_id,
      NEW.entities_limit,
      OLD.subscription_tier || '/' || OLD.subscription_status,
      NEW.subscription_tier || '/' || NEW.subscription_status,
      'webhook_update'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for subscription changes
DROP TRIGGER IF EXISTS log_subscriber_changes ON public.subscribers;
CREATE TRIGGER log_subscriber_changes
  AFTER UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Function to sync subscription_end from current_period_end
CREATE OR REPLACE FUNCTION public.sync_subscription_end()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.subscription_end := NEW.current_period_end;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-sync subscription_end
DROP TRIGGER IF EXISTS sync_subscription_end_trigger ON public.subscribers;
CREATE TRIGGER sync_subscription_end_trigger
  BEFORE INSERT OR UPDATE OF current_period_end ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_end();

-- ============================================
-- STEP 7: Grant permissions
-- ============================================

-- Grant usage on all sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions on tables
GRANT ALL ON public.subscribers TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.subscribers TO authenticated;

GRANT ALL ON public.stripe_events TO service_role;
GRANT ALL ON public.stripe_invoices TO service_role;
GRANT ALL ON public.subscription_history TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.log_stripe_event TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_event_processed TO service_role;
GRANT EXECUTE ON FUNCTION public.update_subscriber_from_webhook TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- Run these after the migration to verify success
-- ============================================

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('subscribers', 'stripe_events', 'stripe_invoices', 'subscription_history')
-- ORDER BY table_name;

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('log_stripe_event', 'update_subscriber_from_webhook', 'mark_event_processed')
-- ORDER BY routine_name;

-- Check subscribers table columns
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'subscribers'
-- ORDER BY ordinal_position;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
