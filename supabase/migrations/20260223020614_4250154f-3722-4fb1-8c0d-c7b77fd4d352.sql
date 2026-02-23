
-- 1. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'pending')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Assign admin role to ove.eriksson@dahai.se
INSERT INTO public.user_roles (user_id, role)
VALUES ('077d0153-5c56-40e5-8a3d-e887c8cb14e3', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Create profile for existing admin user
INSERT INTO public.profiles (user_id, full_name, role)
VALUES ('077d0153-5c56-40e5-8a3d-e887c8cb14e3', 'ove.eriksson@dahai.se', 'approved')
ON CONFLICT (user_id) DO NOTHING;

-- 4. RLS: Admins can view all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 5. RLS: Admins can update all profiles (for approving users)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));
