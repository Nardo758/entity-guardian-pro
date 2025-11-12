-- 1) Ensure profiles.user_id is unique to allow ON CONFLICT and 1:1 relation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END$$;

-- 2) Create or replace trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Attempt to insert a profile for the new auth user.
  -- Any failure here should NOT block user signup, so we catch and log.
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
      NEW.raw_user_meta_data->>'user_type',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Do not block signup if anything goes wrong
    RAISE NOTICE 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 3) Recreate trigger to ensure it exists and points to the latest function
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    DROP TRIGGER on_auth_user_created ON auth.users;
  END IF;
END$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();