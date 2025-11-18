-- Billing Refactor Migration
-- This migration adds support for setup intents and improved payment method management

-- Add setup_intent tracking to payment_methods table
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS setup_intent_id text,
ADD COLUMN IF NOT EXISTS setup_intent_status text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_setup_intent 
ON payment_methods(setup_intent_id);

-- Add comment for documentation
COMMENT ON COLUMN payment_methods.setup_intent_id IS 'Stripe SetupIntent ID used to create this payment method';
COMMENT ON COLUMN payment_methods.setup_intent_status IS 'Status of the SetupIntent (succeeded, processing, requires_action, etc.)';