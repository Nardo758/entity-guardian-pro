-- Create analytics_data table to stop 404s and support security/metrics logging
CREATE TABLE IF NOT EXISTS public.analytics_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_id uuid NULL,
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;

-- Drop old policies if any
DROP POLICY IF EXISTS analytics_owner_select ON public.analytics_data;
DROP POLICY IF EXISTS analytics_owner_insert ON public.analytics_data;
DROP POLICY IF EXISTS analytics_owner_update ON public.analytics_data;
DROP POLICY IF EXISTS analytics_owner_delete ON public.analytics_data;
DROP POLICY IF EXISTS analytics_admin_select ON public.analytics_data;

-- Owner policies
CREATE POLICY analytics_owner_select
ON public.analytics_data FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY analytics_owner_insert
ON public.analytics_data FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY analytics_owner_update
ON public.analytics_data FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY analytics_owner_delete
ON public.analytics_data FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all analytics
CREATE POLICY analytics_admin_select
ON public.analytics_data FOR SELECT TO authenticated
USING (public.has_role('admin'::app_role, auth.uid()));

-- Updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_analytics_data_updated_at'
  ) THEN
    CREATE TRIGGER trg_analytics_data_updated_at
    BEFORE UPDATE ON public.analytics_data
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;