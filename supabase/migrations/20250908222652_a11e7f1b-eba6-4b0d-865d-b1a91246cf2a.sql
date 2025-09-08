-- Add phone verification table for SMS integration
CREATE TABLE IF NOT EXISTS public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add phone verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Add indexes for phone verifications
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON public.phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires_at ON public.phone_verifications(expires_at);

-- Enable RLS for phone verifications
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for phone verifications
CREATE POLICY "Users can manage their own phone verifications" ON public.phone_verifications
  FOR ALL USING (auth.uid() = user_id);