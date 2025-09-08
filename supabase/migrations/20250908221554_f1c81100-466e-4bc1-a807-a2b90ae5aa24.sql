-- Fix critical security vulnerabilities: Add RLS to exposed tables

-- Enable RLS on referral_programs table to prevent public access to business strategy
ALTER TABLE public.referral_programs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only admins to view referral programs
CREATE POLICY "Only admins can view referral programs" ON public.referral_programs
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

-- Create policy to allow only admins to manage referral programs  
CREATE POLICY "Only admins can manage referral programs" ON public.referral_programs
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  ));

-- Fix viral_content table exposure (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'viral_content') THEN
    EXECUTE 'ALTER TABLE public.viral_content ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'CREATE POLICY "Only admins can view viral content" ON public.viral_content
      FOR SELECT 
      USING (EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = ''admin''::app_role
      ))';
      
    EXECUTE 'CREATE POLICY "Only admins can manage viral content" ON public.viral_content
      FOR ALL 
      USING (EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() AND ur.role = ''admin''::app_role
      ))';
  END IF;
END $$;

-- Add rate limiting table for API security
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for rate limits (only system can manage)
CREATE POLICY "System manages rate limits" ON public.api_rate_limits
  FOR ALL
  USING (false); -- Only accessible via service role

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_user_endpoint ON public.api_rate_limits(user_id, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_ip_endpoint ON public.api_rate_limits(ip_address, endpoint, window_start);

-- Add security events logging enhancement
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type TEXT,
  user_id_param UUID DEFAULT NULL,
  ip_address_param INET DEFAULT NULL,
  details JSONB DEFAULT '{}'::jsonb
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_data (
    user_id,
    metric_name,
    metric_value,
    metric_type,
    metric_date,
    metadata
  ) VALUES (
    COALESCE(user_id_param, '00000000-0000-0000-0000-000000000000'::uuid),
    violation_type,
    1,
    'security_violation',
    CURRENT_DATE,
    details || jsonb_build_object(
      'timestamp', now(),
      'ip_address', ip_address_param,
      'severity', 'high'
    )
  );
END;
$$;