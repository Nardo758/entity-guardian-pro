-- Fix the subscribed user's data to reflect their active Stripe subscription
UPDATE public.subscribers
SET 
  subscribed = true,
  subscription_tier = 'Starter',
  subscription_status = 'active',
  stripe_subscription_id = 'sub_1SZg50CnuIeihlVEJiRYi1dw',
  is_trial_active = false,
  current_period_end = '2026-01-01T23:00:26.000Z'::timestamptz,
  updated_at = now()
WHERE email = 'ldixon@myersapartmentgroup.com';