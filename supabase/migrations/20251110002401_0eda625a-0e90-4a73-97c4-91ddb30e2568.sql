-- Create enum for app roles if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
  OR user_id = auth.uid()
);

-- Only admins can assign roles
CREATE POLICY "Admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Only admins can modify roles
CREATE POLICY "Admins can modify roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Now create the security report configuration table
CREATE TABLE public.security_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'manual')),
  schedule_time TIME NOT NULL DEFAULT '08:00:00',
  schedule_day INTEGER CHECK (schedule_day >= 0 AND schedule_day <= 6),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  email_subject TEXT NOT NULL DEFAULT 'Security Report',
  email_template TEXT NOT NULL DEFAULT 'default',
  custom_html TEXT,
  recipient_user_ids UUID[] NOT NULL DEFAULT '{}',
  include_ip_reputation BOOLEAN NOT NULL DEFAULT true,
  include_violations BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_report_config ENABLE ROW LEVEL SECURITY;

-- Admin users can manage report configs
CREATE POLICY "Admins can view report configs"
ON public.security_report_config
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can insert report configs"
ON public.security_report_config
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can update report configs"
ON public.security_report_config
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete report configs"
ON public.security_report_config
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_security_report_config_updated_at
BEFORE UPDATE ON public.security_report_config
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create table for report execution history
CREATE TABLE public.security_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.security_report_config(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  stats JSONB,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for history
ALTER TABLE public.security_report_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view report history"
ON public.security_report_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role
  )
);