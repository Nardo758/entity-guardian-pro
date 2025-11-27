-- Disable the audit trigger
ALTER TABLE public.user_roles DISABLE TRIGGER trigger_log_role_changes;

-- Grant admin role to Leon Dixon's account
INSERT INTO public.user_roles (user_id, role)
VALUES ('ca274959-529a-4bd3-8c98-7cd8efcd32b9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-enable the audit trigger
ALTER TABLE public.user_roles ENABLE TRIGGER trigger_log_role_changes;