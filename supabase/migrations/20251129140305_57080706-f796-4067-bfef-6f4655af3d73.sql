-- Add site owner designation to admin_accounts
ALTER TABLE public.admin_accounts 
ADD COLUMN IF NOT EXISTS is_site_owner boolean DEFAULT false;

-- Set the first created admin as site owner
UPDATE public.admin_accounts 
SET is_site_owner = true 
WHERE id = (
  SELECT id FROM public.admin_accounts 
  ORDER BY created_at ASC 
  LIMIT 1
);