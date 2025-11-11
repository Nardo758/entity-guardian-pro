-- Create IP reputation tracking table
CREATE TABLE IF NOT EXISTS public.ip_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reputation_score INTEGER NOT NULL DEFAULT 100, -- Score from 0 (worst) to 100 (best)
  total_requests BIGINT DEFAULT 0,
  failed_auth_attempts INTEGER DEFAULT 0,
  rate_limit_violations INTEGER DEFAULT 0,
  suspicious_patterns INTEGER DEFAULT 0,
  last_violation_at TIMESTAMP WITH TIME ZONE,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ip_reputation_ip ON public.ip_reputation(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_score ON public.ip_reputation(reputation_score);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_risk ON public.ip_reputation(risk_level);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_blocked ON public.ip_reputation(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE public.ip_reputation ENABLE ROW LEVEL SECURITY;

-- System can manage IP reputation (for edge functions)
CREATE POLICY "Service role can manage IP reputation"
  ON public.ip_reputation
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to calculate reputation score based on behavior
CREATE OR REPLACE FUNCTION public.calculate_ip_reputation(
  p_ip_address INET,
  p_failed_auth INTEGER DEFAULT 0,
  p_rate_violations INTEGER DEFAULT 0,
  p_suspicious INTEGER DEFAULT 0
)
RETURNS TABLE(
  reputation_score INTEGER,
  risk_level TEXT,
  blocked_until TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER;
  v_risk TEXT;
  v_blocked TIMESTAMP WITH TIME ZONE;
  v_total_violations INTEGER;
BEGIN
  v_total_violations := p_failed_auth + p_rate_violations + p_suspicious;
  
  -- Calculate reputation score (0-100)
  -- Start at 100 and deduct points for violations
  v_score := 100;
  v_score := v_score - (p_failed_auth * 5); -- -5 per failed auth
  v_score := v_score - (p_rate_violations * 10); -- -10 per rate limit violation
  v_score := v_score - (p_suspicious * 15); -- -15 per suspicious pattern
  
  -- Ensure score stays within bounds
  v_score := GREATEST(0, LEAST(100, v_score));
  
  -- Determine risk level and blocking
  IF v_score >= 80 THEN
    v_risk := 'low';
    v_blocked := NULL;
  ELSIF v_score >= 60 THEN
    v_risk := 'medium';
    v_blocked := NULL;
  ELSIF v_score >= 30 THEN
    v_risk := 'high';
    -- Block for 1 hour
    v_blocked := now() + INTERVAL '1 hour';
  ELSE
    v_risk := 'critical';
    -- Block for 24 hours
    v_blocked := now() + INTERVAL '24 hours';
  END IF;
  
  RETURN QUERY SELECT v_score, v_risk, v_blocked;
END;
$$;

-- Function to update IP reputation
CREATE OR REPLACE FUNCTION public.update_ip_reputation(
  p_ip_address INET,
  p_event_type TEXT, -- 'failed_auth', 'rate_limit', 'suspicious'
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
  reputation_score INTEGER,
  risk_level TEXT,
  blocked_until TIMESTAMP WITH TIME ZONE,
  should_block BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_new_score INTEGER;
  v_new_risk TEXT;
  v_new_blocked TIMESTAMP WITH TIME ZONE;
  v_failed INTEGER := 0;
  v_rate INTEGER := 0;
  v_suspicious INTEGER := 0;
BEGIN
  -- Get or create IP reputation record
  SELECT * INTO v_record FROM public.ip_reputation WHERE ip_address = p_ip_address;
  
  IF v_record IS NULL THEN
    -- Create new record
    INSERT INTO public.ip_reputation (ip_address, total_requests)
    VALUES (p_ip_address, 1)
    RETURNING * INTO v_record;
  END IF;
  
  -- Update counters based on event type
  IF p_event_type = 'failed_auth' THEN
    v_failed := v_record.failed_auth_attempts + 1;
    v_rate := v_record.rate_limit_violations;
    v_suspicious := v_record.suspicious_patterns;
  ELSIF p_event_type = 'rate_limit' THEN
    v_failed := v_record.failed_auth_attempts;
    v_rate := v_record.rate_limit_violations + 1;
    v_suspicious := v_record.suspicious_patterns;
  ELSIF p_event_type = 'suspicious' THEN
    v_failed := v_record.failed_auth_attempts;
    v_rate := v_record.rate_limit_violations;
    v_suspicious := v_record.suspicious_patterns + 1;
  END IF;
  
  -- Calculate new reputation
  SELECT * INTO v_new_score, v_new_risk, v_new_blocked
  FROM public.calculate_ip_reputation(p_ip_address, v_failed, v_rate, v_suspicious);
  
  -- Update the record
  UPDATE public.ip_reputation
  SET
    reputation_score = v_new_score,
    risk_level = v_new_risk,
    failed_auth_attempts = v_failed,
    rate_limit_violations = v_rate,
    suspicious_patterns = v_suspicious,
    last_violation_at = CASE WHEN p_event_type != 'request' THEN now() ELSE last_violation_at END,
    last_seen_at = now(),
    blocked_until = v_new_blocked,
    total_requests = total_requests + 1,
    metadata = metadata || p_metadata,
    updated_at = now()
  WHERE ip_address = p_ip_address;
  
  RETURN QUERY SELECT 
    v_new_score,
    v_new_risk,
    v_new_blocked,
    (v_new_blocked IS NOT NULL AND v_new_blocked > now()) as should_block;
END;
$$;

-- Function to clean up old IP reputation data (older than 90 days with good reputation)
CREATE OR REPLACE FUNCTION public.cleanup_ip_reputation()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.ip_reputation
  WHERE last_seen_at < now() - INTERVAL '90 days'
    AND reputation_score >= 80
    AND risk_level = 'low';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_ip_reputation_updated_at
  BEFORE UPDATE ON public.ip_reputation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Log the creation
DO $$
BEGIN
  RAISE NOTICE 'IP reputation tracking system created successfully';
END $$;