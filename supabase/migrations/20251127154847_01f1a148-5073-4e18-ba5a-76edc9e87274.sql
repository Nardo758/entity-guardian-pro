-- Clear rate limit entries for the user's IP
DELETE FROM api_rate_limits 
WHERE ip_address = '73.124.37.253'::inet 
AND endpoint = 'auth';

-- Reset IP reputation to allow password reset
UPDATE ip_reputation 
SET 
  reputation_score = 100,
  risk_level = 'low',
  rate_limit_violations = 0,
  blocked_until = NULL,
  failed_auth_attempts = 0,
  last_violation_at = NULL,
  updated_at = now()
WHERE ip_address = '73.124.37.253'::inet;