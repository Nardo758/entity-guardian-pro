-- Create role enum for team permissions
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'manager', 'member');

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create team_memberships table
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  invited_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL,
  email text NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Add team_id to entities table
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS team_id uuid;

-- Create security definer functions to check team permissions
CREATE OR REPLACE FUNCTION public.get_user_team_role(team_uuid uuid, user_uuid uuid)
RETURNS team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.team_memberships 
  WHERE team_id = team_uuid AND user_id = user_uuid;
$$;

CREATE OR REPLACE FUNCTION public.user_has_team_permission(team_uuid uuid, user_uuid uuid, required_role team_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN required_role = 'member' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid)
    WHEN required_role = 'manager' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid AND role IN ('owner', 'admin', 'manager'))
    WHEN required_role = 'admin' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid AND role IN ('owner', 'admin'))
    WHEN required_role = 'owner' THEN 
      EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_uuid AND user_id = user_uuid AND role = 'owner')
    ELSE false
  END;
$$;

-- RLS Policies for teams
CREATE POLICY "Users can view teams they belong to" 
ON public.teams 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships 
    WHERE team_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners and admins can update teams" 
ON public.teams 
FOR UPDATE 
USING (public.user_has_team_permission(id, auth.uid(), 'admin'));

CREATE POLICY "Team owners can delete teams" 
ON public.teams 
FOR DELETE 
USING (public.user_has_team_permission(id, auth.uid(), 'owner'));

-- RLS Policies for team_memberships
CREATE POLICY "Users can view team memberships for their teams" 
ON public.team_memberships 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  public.user_has_team_permission(team_id, auth.uid(), 'member')
);

CREATE POLICY "Team admins can manage memberships" 
ON public.team_memberships 
FOR ALL 
USING (public.user_has_team_permission(team_id, auth.uid(), 'admin'))
WITH CHECK (public.user_has_team_permission(team_id, auth.uid(), 'admin'));

-- RLS Policies for team_invitations
CREATE POLICY "Users can view invitations for their teams" 
ON public.team_invitations 
FOR SELECT 
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  public.user_has_team_permission(team_id, auth.uid(), 'admin')
);

CREATE POLICY "Team admins can create invitations" 
ON public.team_invitations 
FOR INSERT 
WITH CHECK (public.user_has_team_permission(team_id, auth.uid(), 'admin'));

CREATE POLICY "Team admins can update invitations" 
ON public.team_invitations 
FOR UPDATE 
USING (public.user_has_team_permission(team_id, auth.uid(), 'admin'));

CREATE POLICY "Team admins can delete invitations" 
ON public.team_invitations 
FOR DELETE 
USING (public.user_has_team_permission(team_id, auth.uid(), 'admin'));

-- Update entities RLS to include team access
DROP POLICY IF EXISTS "Users can view their own entities" ON public.entities;
CREATE POLICY "Users can view their own entities and team entities" 
ON public.entities 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (team_id IS NOT NULL AND public.user_has_team_permission(team_id, auth.uid(), 'member'))
);

DROP POLICY IF EXISTS "Users can create their own entities" ON public.entities;
CREATE POLICY "Users can create entities for themselves and teams" 
ON public.entities 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (team_id IS NULL OR public.user_has_team_permission(team_id, auth.uid(), 'manager'))
);

DROP POLICY IF EXISTS "Users can update their own entities" ON public.entities;
CREATE POLICY "Users can update their own entities and team entities" 
ON public.entities 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  (team_id IS NOT NULL AND public.user_has_team_permission(team_id, auth.uid(), 'manager'))
);

DROP POLICY IF EXISTS "Users can delete their own entities" ON public.entities;
CREATE POLICY "Users can delete their own entities and team entities" 
ON public.entities 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  (team_id IS NOT NULL AND public.user_has_team_permission(team_id, auth.uid(), 'admin'))
);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_memberships_updated_at
  BEFORE UPDATE ON public.team_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token text;
BEGIN
  -- Generate a secure random token
  token := encode(gen_random_bytes(32), 'hex');
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.team_invitations WHERE token = token) LOOP
    token := encode(gen_random_bytes(32), 'hex');
  END LOOP;
  RETURN token;
END;
$$;