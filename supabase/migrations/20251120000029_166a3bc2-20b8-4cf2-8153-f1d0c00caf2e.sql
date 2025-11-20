-- Update IP reputation calculation to allow 15 failed attempts before blocking
-- Current issue: Blocks after 12 attempts (score drops to 40)
-- Fix: Reduce deduction per failed auth from 5 to 4 points, so 15 attempts = score 40

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
  v_score := v_score - (p_failed_auth * 4); -- Changed from 5 to 4: -4 per failed auth
  v_score := v_score - (p_rate_violations * 10); -- -10 per rate limit violation
  v_score := v_score - (p_suspicious * 15); -- -15 per suspicious pattern
  
  -- Ensure score stays within bounds
  v_score := GREATEST(0, LEAST(100, v_score));
  
  -- Determine risk level and blocking
  -- Adjusted thresholds so 15 failed attempts (score=40) triggers high risk
  IF v_score >= 80 THEN
    v_risk := 'low';
    v_blocked := NULL;
  ELSIF v_score >= 60 THEN
    v_risk := 'medium';
    v_blocked := NULL;
  ELSIF v_score >= 40 THEN
    v_risk := 'high';
    -- Block for 5 minutes (was 1 hour)
    v_blocked := now() + INTERVAL '5 minutes';
  ELSE
    v_risk := 'critical';
    -- Block for 15 minutes (was 24 hours)
    v_blocked := now() + INTERVAL '15 minutes';
  END IF;
  
  RETURN QUERY SELECT v_score, v_risk, v_blocked;
END;
$$;