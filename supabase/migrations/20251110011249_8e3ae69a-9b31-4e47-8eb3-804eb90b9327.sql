-- Create table for MFA recovery codes
CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code_hash)
);

-- Enable RLS
ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own recovery codes
CREATE POLICY "Users can view their own recovery codes"
  ON public.mfa_recovery_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own recovery codes
CREATE POLICY "Users can create their own recovery codes"
  ON public.mfa_recovery_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own recovery codes (to mark as used)
CREATE POLICY "Users can update their own recovery codes"
  ON public.mfa_recovery_codes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all recovery codes for audit purposes
CREATE POLICY "Admins can view all recovery codes"
  ON public.mfa_recovery_codes
  FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Function to validate and consume a recovery code
CREATE OR REPLACE FUNCTION public.validate_recovery_code(
  p_user_id UUID,
  p_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_hash TEXT;
  v_code_exists BOOLEAN;
BEGIN
  -- Hash the provided code (using sha256 for simplicity)
  v_code_hash := encode(digest(p_code, 'sha256'), 'hex');
  
  -- Check if unused code exists
  SELECT EXISTS (
    SELECT 1 FROM public.mfa_recovery_codes
    WHERE user_id = p_user_id
      AND code_hash = v_code_hash
      AND used = FALSE
  ) INTO v_code_exists;
  
  IF v_code_exists THEN
    -- Mark code as used
    UPDATE public.mfa_recovery_codes
    SET used = TRUE, used_at = NOW()
    WHERE user_id = p_user_id
      AND code_hash = v_code_hash
      AND used = FALSE;
    
    -- Log the recovery code usage
    INSERT INTO public.analytics_data (
      user_id,
      metric_name,
      metric_value,
      metric_type,
      metric_date,
      metadata
    ) VALUES (
      p_user_id,
      'mfa_recovery_code_used',
      1,
      'security_event',
      CURRENT_DATE,
      jsonb_build_object(
        'timestamp', NOW(),
        'code_hash_prefix', substring(v_code_hash, 1, 8)
      )
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to get count of unused recovery codes
CREATE OR REPLACE FUNCTION public.get_unused_recovery_code_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.mfa_recovery_codes
  WHERE user_id = p_user_id AND used = FALSE;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id ON public.mfa_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_used ON public.mfa_recovery_codes(user_id, used);

-- Add comment
COMMENT ON TABLE public.mfa_recovery_codes IS 'Stores hashed MFA recovery codes for account recovery';