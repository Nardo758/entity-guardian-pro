-- Fix agent role assignment by updating handle_new_user trigger
-- This automatically assigns roles based on user_type metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_type text;
BEGIN
  -- Extract user_type from metadata
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Insert profile
  BEGIN
    INSERT INTO public.profiles (
      user_id,
      first_name,
      last_name,
      company,
      user_type,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'given_name',
        SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 1),
        SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 1)
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'family_name',
        SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 2),
        SPLIT_PART(NEW.raw_user_meta_data->>'name', ' ', 2)
      ),
      NEW.raw_user_meta_data->>'company',
      v_user_type,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Profile creation error for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Assign role based on user_type
  BEGIN
    IF v_user_type = 'agent' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'registered_agent'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSIF v_user_type = 'admin' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      -- Default role for entity owners
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'user'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Role assignment error for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;