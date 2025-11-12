
-- Add performance indexes to improve query performance
-- These indexes will help with foreign key lookups and common query patterns

-- Index for business_owners user_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_business_owners_user_id 
ON public."business _owners" (user_id);

-- Index for security_report_history config_id (foreign key)
CREATE INDEX IF NOT EXISTS idx_security_report_history_config_id 
ON public.security_report_history (config_id);

-- Index for security_report_history executed_at for date queries
CREATE INDEX IF NOT EXISTS idx_security_report_history_executed_at 
ON public.security_report_history (executed_at DESC);

-- Index for payment_methods stripe_payment_method_id for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id 
ON public.payment_methods (stripe_payment_method_id);

-- Index for payment_methods is_default for filtering
CREATE INDEX IF NOT EXISTS idx_payment_methods_default 
ON public.payment_methods (user_id, is_default) 
WHERE is_default = true;

-- Index for subscribers stripe_price_id for pricing queries
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_price_id 
ON public.subscribers (stripe_price_id);

-- Index for subscribers stripe_product_id for product queries
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_product_id 
ON public.subscribers (stripe_product_id);

-- Index for subscribers subscription_end for expiration queries
CREATE INDEX IF NOT EXISTS idx_subscribers_subscription_end 
ON public.subscribers (subscription_end) 
WHERE subscription_end IS NOT NULL;

-- Index for subscription_history stripe_subscription_id for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_subscription_history_stripe_sub_id 
ON public.subscription_history (stripe_subscription_id);

-- Index for subscription_history subscription_tier for analytics
CREATE INDEX IF NOT EXISTS idx_subscription_history_tier 
ON public.subscription_history (subscription_tier);

-- Index for user_roles user_id (for role lookups)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles (user_id);

-- Index for user_roles role (for filtering by role)
CREATE INDEX IF NOT EXISTS idx_user_roles_role 
ON public.user_roles (role);

-- Index for profiles user_type lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_type 
ON public.profiles (user_type) 
WHERE user_type IS NOT NULL;

-- Index for profiles plan for subscription tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_plan 
ON public.profiles (plan) 
WHERE plan IS NOT NULL;

-- Index for stripe_events unprocessed events for webhook processing
CREATE INDEX IF NOT EXISTS idx_stripe_events_unprocessed 
ON public.stripe_events (processed, created_at) 
WHERE processed = false;

-- Index for notifications created_at for timeline queries
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications (created_at DESC);

-- Index for mfa_recovery_codes created_at for security audits
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_created_at 
ON public.mfa_recovery_codes (created_at DESC);
