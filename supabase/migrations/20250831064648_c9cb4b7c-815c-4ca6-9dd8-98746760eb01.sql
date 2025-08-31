-- Create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- Create user_roles table for role-based permissions
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin'::app_role)
$$;

-- RLS policies for user_roles table
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Add unlimited plan option
ALTER TABLE public.profiles 
ALTER COLUMN plan 
SET DEFAULT 'starter';

-- Update profiles table to support unlimited plan
COMMENT ON COLUMN public.profiles.plan IS 'Available plans: starter, professional, business, enterprise, unlimited';

-- Create trigger to update updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create your admin profile if you're logged in
DO $$
BEGIN
    -- Insert profile with unlimited plan if user is authenticated
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.profiles (
            user_id,
            plan,
            user_type,
            first_name,
            last_name,
            company
        ) VALUES (
            auth.uid(),
            'unlimited',
            'entity_owner',
            'Admin',
            'User',
            'System Administrator'
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            plan = 'unlimited',
            updated_at = now();

        -- Grant admin role
        INSERT INTO public.user_roles (user_id, role, created_by)
        VALUES (auth.uid(), 'admin'::app_role, auth.uid())
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Also grant manager and user roles for complete access
        INSERT INTO public.user_roles (user_id, role, created_by)
        VALUES (auth.uid(), 'manager'::app_role, auth.uid())
        ON CONFLICT (user_id, role) DO NOTHING;

        INSERT INTO public.user_roles (user_id, role, created_by)
        VALUES (auth.uid(), 'user'::app_role, auth.uid())
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;