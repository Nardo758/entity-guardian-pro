-- Migration: Add security and performance optimizations for Stripe integration
-- Created: 2025-11-07
-- Purpose: Enhance existing Stripe tables with security restrictions and composite indexes
-- Prerequisites: Requires 20251106_stripe_subscription_tables.sql to be applied first

-- ============================================
-- 1. Enable required extensions
-- ============================================

-- Enable pgcrypto for gen_random_uuid and encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp as backup for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. Security: Restrict function execution permissions
-- ============================================

-- Restrict execution of the webhook handler to service_role only
-- This prevents authenticated users from directly calling sensitive webhook functions
DO $$
BEGIN
  -- Adjust the signature if your function arguments differ
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_subscriber_from_webhook'
      AND pg_get_function_identity_arguments(p.oid) =
          'text, text, text, text, timestamp with time zone, timestamp with time zone, boolean'
  ) THEN
    REVOKE ALL ON FUNCTION public.update_subscriber_from_webhook(
      text, text, text, text, timestamptz, timestamptz, boolean
    ) FROM PUBLIC, anon, authenticated;
    
    GRANT EXECUTE ON FUNCTION public.update_subscriber_from_webhook(
      text, text, text, text, timestamptz, timestamptz, boolean
    ) TO service_role;
    
    RAISE NOTICE 'Successfully restricted update_subscriber_from_webhook to service_role';
  ELSE
    RAISE NOTICE 'Function update_subscriber_from_webhook not found or signature mismatch - skipping security restriction';
  END IF;
END$$;

-- Restrict log_stripe_event function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'log_stripe_event'
  ) THEN
    REVOKE ALL ON FUNCTION public.log_stripe_event FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.log_stripe_event TO service_role;
    RAISE NOTICE 'Successfully restricted log_stripe_event to service_role';
  END IF;
END$$;

-- Restrict mark_event_processed function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'mark_event_processed'
  ) THEN
    REVOKE ALL ON FUNCTION public.mark_event_processed FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.mark_event_processed TO service_role;
    RAISE NOTICE 'Successfully restricted mark_event_processed to service_role';
  END IF;
END$$;

-- ============================================
-- 3. Performance: Composite indexes for common query patterns
-- ============================================

-- Composite index for user subscription status queries
-- Optimizes: SELECT * FROM subscribers WHERE user_id = ? AND subscription_status = 'active'
CREATE INDEX IF NOT EXISTS idx_subscribers_user_status
  ON public.subscribers(user_id, subscription_status);

-- Composite index for subscription lookup with status
-- Optimizes: SELECT * FROM subscribers WHERE stripe_subscription_id = ? AND subscription_status = ?
CREATE INDEX IF NOT EXISTS idx_subscribers_subscription_status
  ON public.subscribers(stripe_subscription_id, subscription_status);

-- Composite index for user + customer ID lookups (useful for webhook processing)
-- Optimizes: SELECT * FROM subscribers WHERE user_id = ? AND stripe_customer_id = ?
CREATE INDEX IF NOT EXISTS idx_subscribers_user_customer
  ON public.subscribers(user_id, stripe_customer_id);

-- ============================================
-- 4. Invoice indexes for billing queries
-- ============================================

-- Composite index for user invoice status queries
-- Optimizes: SELECT * FROM stripe_invoices WHERE user_id = ? AND status = 'paid'
CREATE INDEX IF NOT EXISTS idx_invoices_user_status
  ON public.stripe_invoices(user_id, status);

-- Composite index for user invoice history (most recent first)
-- Optimizes: SELECT * FROM stripe_invoices WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_invoices_user_created_at
  ON public.stripe_invoices(user_id, created_at DESC);

-- Composite index for subscription invoices (most recent first)
-- Optimizes: SELECT * FROM stripe_invoices WHERE stripe_subscription_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_created
  ON public.stripe_invoices(stripe_subscription_id, created_at DESC);

-- ============================================
-- 5. Event indexes for webhook processing
-- ============================================

-- Composite index for event type and processing status
-- Optimizes: SELECT * FROM stripe_events WHERE event_type = ? AND processed = false
CREATE INDEX IF NOT EXISTS idx_events_type_processed
  ON public.stripe_events(event_type, processed);

-- ============================================
-- 6. Add documentation comments
-- ============================================

COMMENT ON INDEX idx_subscribers_user_status IS 'Optimizes user subscription status lookups';
COMMENT ON INDEX idx_subscribers_subscription_status IS 'Optimizes Stripe subscription ID status lookups';
COMMENT ON INDEX idx_subscribers_user_customer IS 'Optimizes webhook processing user + customer lookups';
COMMENT ON INDEX idx_invoices_user_status IS 'Optimizes user invoice status queries';
COMMENT ON INDEX idx_invoices_user_created_at IS 'Optimizes user invoice history queries';
COMMENT ON INDEX idx_invoices_subscription_created IS 'Optimizes subscription invoice history queries';
COMMENT ON INDEX idx_events_type_processed IS 'Optimizes webhook event processing queue';

-- ============================================
-- Migration complete
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 20251107_add_stripe_security_indexes.sql completed successfully';
  RAISE NOTICE 'Added security restrictions and performance indexes';
  RAISE NOTICE '==============================================';
END$$;
