
-- Create api_rate_limits table for rate limiting functionality
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB,
  UNIQUE(user_id, endpoint, window_start)
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_endpoint 
ON public.api_rate_limits (user_id, endpoint, window_start);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_endpoint 
ON public.api_rate_limits (ip_address, endpoint, window_start);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start 
ON public.api_rate_limits (window_start);

-- Enable RLS
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
