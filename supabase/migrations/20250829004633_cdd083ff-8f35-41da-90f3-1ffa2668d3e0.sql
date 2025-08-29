-- Create Stripe payment processing functions and update existing schema
-- Add Stripe-related columns to payments table if not exists
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS processing_fee INTEGER DEFAULT 0;

-- Add payment processing status tracking
DO $$ BEGIN
  CREATE TYPE payment_processing_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'canceled');
EXCEPTION 
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS processing_status payment_processing_status DEFAULT 'pending';

-- Update payment_methods table for Stripe integration
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
ADD COLUMN IF NOT EXISTS last_four TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT;