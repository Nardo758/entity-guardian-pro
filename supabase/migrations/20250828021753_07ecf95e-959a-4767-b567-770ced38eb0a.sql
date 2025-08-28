-- Fix search path for security definer functions
ALTER FUNCTION public.get_user_team_role(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.user_has_team_permission(uuid, uuid, team_role) SET search_path = public;
ALTER FUNCTION public.generate_invitation_token() SET search_path = public;