-- Add account status columns to profiles for user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid;

-- Create index for account status queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);