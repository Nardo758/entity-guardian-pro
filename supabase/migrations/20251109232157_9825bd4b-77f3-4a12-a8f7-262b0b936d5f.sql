-- Ensure the trigger function handles OAuth providers properly
-- This will automatically create profiles for OAuth users

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle all auth types including OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
  -- For OAuth users, extract name from raw_user_meta_data
  -- For email users, use metadata passed during signup
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    company,
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
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates a profile when a new user signs up via email or OAuth providers (Google, Microsoft, etc.)';
