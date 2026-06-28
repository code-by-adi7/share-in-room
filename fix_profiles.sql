-- 1. BACKFILL EXISTING USERS
-- This copies all users that have already signed up into the profiles table
INSERT INTO public.profiles (id, name, created_at)
SELECT 
  id, 
  raw_user_meta_data->>'name', 
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. CREATE A TRIGGER FOR NEW SIGNUPS
-- This ensures that anyone who signs up in the future automatically gets a profile record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, created_at)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists (just to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Attach the trigger to the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. ENSURE EVERYONE CAN READ THE PROFILES (If not done already)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;

CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
