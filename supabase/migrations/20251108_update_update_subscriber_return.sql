-- Migration: replace update_subscriber_from_webhook to return subscriber id (UUID)
-- Adds a safer version of the webhook upsert that returns the subscriber internal id.
-- Run this in Supabase SQL editor or include in your migration pipeline.

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
  v_subscriber_id UUID;
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

  -- Upsert subscriber row and return its internal id (UUID)
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
    subscription_end,
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
    p_current_period_end,
    now()
  )
  ON CONFLICT (stripe_customer_id)
  DO UPDATE SET
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    subscription_tier = EXCLUDED.subscription_tier,
    subscription_status = EXCLUDED.subscription_status,
    subscribed = EXCLUDED.subscribed,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    entities_limit = EXCLUDED.entities_limit,
    subscription_end = EXCLUDED.subscription_end,
    updated_at = now()
  RETURNING id INTO v_subscriber_id;

  RETURN v_subscriber_id;
END;
$$;

-- Grant execute to service role (idempotent)
GRANT EXECUTE ON FUNCTION public.update_subscriber_from_webhook(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO service_role;

-- Migration complete
