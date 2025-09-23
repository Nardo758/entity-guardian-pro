-- Fix site URL configuration for email redirects
-- This ensures email confirmation links redirect to the correct domain

-- Update auth configuration (if accessible)
-- Note: This might need to be done via Supabase Dashboard instead
-- But we can try to set it via SQL if the table exists

-- Alternative approach: Create a configuration table
CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert site URL configuration
INSERT INTO public.app_config (key, value) 
VALUES ('site_url', 'https://entityrenewalpro.com')
ON CONFLICT (key) 
DO UPDATE SET value = 'https://entityrenewalpro.com', updated_at = now();

-- Insert redirect URL configuration  
INSERT INTO public.app_config (key, value)
VALUES ('email_redirect_url', 'https://entityrenewalpro.com')
ON CONFLICT (key)
DO UPDATE SET value = 'https://entityrenewalpro.com', updated_at = now();
