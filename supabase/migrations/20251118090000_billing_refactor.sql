-- ============================================
-- Billing refactor: promote subscribers -> subscriptions
-- ============================================

-- 1. Rename subscribers table to subscriptions (if it still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscribers'
  ) THEN
    ALTER TABLE public.subscribers RENAME TO subscriptions;
  END IF;
END $$;

-- 2. Rename common indexes/constraints created with subscribers prefix
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT relname AS idx_name
    FROM pg_class
    WHERE relname IN (
      'idx_subscribers_stripe_customer_id',
      'idx_subscribers_stripe_subscription_id',
      'idx_subscribers_subscription_status',
      'idx_subscribers_user_id',
      'idx_subscribers_payment_intent_id',
      'idx_subscribers_subscription_end',
      'idx_subscribers_stripe_price_id',
      'idx_subscribers_stripe_product_id'
    )
  LOOP
    EXECUTE format('ALTER INDEX %I RENAME TO %s',
      rec.idx_name,
      replace(rec.idx_name, 'subscribers', 'subscriptions')
    );
  END LOOP;
END $$;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conname IN (
      'subscribers_stripe_customer_id_key',
      'subscribers_stripe_subscription_id_key',
      'subscribers_subscription_status_check',
      'subscribers_billing_cycle_check'
    )
  LOOP
    EXECUTE format('ALTER TABLE public.subscriptions RENAME CONSTRAINT %I TO %s',
      rec.conname,
      replace(rec.conname, 'subscribers', 'subscriptions')
    );
  END LOOP;
END $$;

-- 3. Rename legacy columns to the new contract
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.subscriptions
      RENAME COLUMN subscription_tier TO plan_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subscriptions'
      AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.subscriptions
      RENAME COLUMN subscription_status TO status;
  END IF;
END $$;

-- 4. Normalize plan_id/status data before enforcing constraints
UPDATE public.subscriptions
SET plan_id = COALESCE(NULLIF(TRIM(LOWER(plan_id)), ''), 'free');

UPDATE public.subscriptions
SET status = COALESCE(NULLIF(TRIM(LOWER(status)), ''),
                      CASE WHEN subscribed IS TRUE THEN 'active' ELSE 'inactive' END);

-- 5. Align column constraints with new contract
ALTER TABLE public.subscriptions
  ALTER COLUMN plan_id SET DEFAULT 'free',
  ALTER COLUMN status SET DEFAULT 'inactive',
  ALTER COLUMN plan_id SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

-- 6. Ensure there is always a current_period_end mirror (required by UI/tests)
ALTER TABLE public.subscriptions
  ALTER COLUMN current_period_end DROP DEFAULT;

-- 7. Indexes/constraints for quick lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id_unique
  ON public.subscriptions(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
  ON public.subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id
  ON public.subscriptions(stripe_subscription_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_methods_user_unique
  ON public.payment_methods(user_id)
  WHERE user_id IS NOT NULL AND is_default = true;

-- 8. Replace RLS policies with plan-centric versions
DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
      AND policyname = 'select_own_subscription'
  ) THEN
    DROP POLICY "select_own_subscription" ON public.subscriptions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
      AND policyname = 'insert_subscription'
  ) THEN
    DROP POLICY "insert_subscription" ON public.subscriptions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscriptions'
      AND policyname = 'update_own_subscription'
  ) THEN
    DROP POLICY "update_own_subscription" ON public.subscriptions;
  END IF;
END;
$policy$;

CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_own"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON public.subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;

-- 9. Replace webhook helper with subscription-aware version
DROP FUNCTION IF EXISTS public.update_subscriber_from_webhook(
  TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN
);

CREATE OR REPLACE FUNCTION public.update_subscription_from_webhook(
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
  v_plan_id TEXT;
  v_entities_limit INTEGER;
  v_billing_cycle TEXT;
BEGIN
  IF p_stripe_price_id ILIKE '%starter%' THEN
    v_plan_id := 'starter';
    v_entities_limit := 4;
  ELSIF p_stripe_price_id ILIKE '%growth%' THEN
    v_plan_id := 'growth';
    v_entities_limit := 20;
  ELSIF p_stripe_price_id ILIKE '%professional%' THEN
    v_plan_id := 'professional';
    v_entities_limit := 50;
  ELSIF p_stripe_price_id ILIKE '%enterprise%' THEN
    v_plan_id := 'enterprise';
    v_entities_limit := 150;
  ELSE
    v_plan_id := 'free';
    v_entities_limit := 1;
  END IF;

  IF p_stripe_price_id ILIKE '%year%' THEN
    v_billing_cycle := 'yearly';
  ELSE
    v_billing_cycle := 'monthly';
  END IF;

  INSERT INTO public.subscriptions (
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    plan_id,
    status,
    subscribed,
    current_period_start,
    current_period_end,
    subscription_end,
    cancel_at_period_end,
    entities_limit,
    billing_cycle,
    updated_at
  )
  VALUES (
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    v_plan_id,
    LOWER(p_subscription_status),
    (LOWER(p_subscription_status) = 'active'),
    p_current_period_start,
    p_current_period_end,
    p_current_period_end,
    p_cancel_at_period_end,
    v_entities_limit,
    v_billing_cycle,
    now()
  )
  ON CONFLICT (stripe_customer_id)
  DO UPDATE SET
    stripe_subscription_id = p_stripe_subscription_id,
    stripe_price_id = p_stripe_price_id,
    plan_id = v_plan_id,
    status = LOWER(p_subscription_status),
    subscribed = (LOWER(p_subscription_status) = 'active'),
    current_period_start = p_current_period_start,
    current_period_end = p_current_period_end,
    subscription_end = p_current_period_end,
    cancel_at_period_end = p_cancel_at_period_end,
    entities_limit = v_entities_limit,
    billing_cycle = v_billing_cycle,
    updated_at = now()
  RETURNING user_id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- Backwards compatibility shim for any code that still invokes the old function name
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
AS $$
BEGIN
  RETURN public.update_subscription_from_webhook(
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_subscription_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end
  );
END;
$$;

-- 10. Rebuild triggers/functions that referenced old column names
DROP FUNCTION IF EXISTS public.log_subscription_change();

CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.plan_id IS DISTINCT FROM NEW.plan_id OR
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.billing_cycle IS DISTINCT FROM NEW.billing_cycle
  ) THEN
    INSERT INTO public.subscription_history (
      user_id,
      subscription_tier,
      billing_cycle,
      status,
      started_at,
      ended_at,
      amount,
      stripe_subscription_id,
      reason,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.plan_id,
      COALESCE(NEW.billing_cycle, 'monthly'),
      NEW.status,
      NEW.current_period_start,
      CASE
        WHEN NEW.status IN ('canceled', 'incomplete_expired', 'past_due') THEN now()
        ELSE NULL
      END,
      NULL,
      NEW.stripe_subscription_id,
      'webhook_update',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_subscription_changes ON public.subscriptions;
CREATE TRIGGER log_subscription_changes
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_subscription_change();

DROP TRIGGER IF EXISTS sync_subscription_end_trigger ON public.subscriptions;
CREATE TRIGGER sync_subscription_end_trigger
  BEFORE INSERT OR UPDATE OF current_period_end ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_end();

-- 11. Final grants (idempotent)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
