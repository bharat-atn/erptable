
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'hr_admin', 'hr_staff', 'user');

-- 2. Create user_roles table (no policies yet)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create has_role function FIRST
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Create is_hr_user helper
CREATE OR REPLACE FUNCTION public.is_hr_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('hr_staff', 'hr_admin', 'admin')
  )
$$;

-- 5. Now add policies on user_roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 6. Migrate existing roles from profiles
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id,
  CASE
    WHEN p.role = 'hr_admin' THEN 'hr_admin'::app_role
    WHEN p.role = 'hr_staff' THEN 'hr_staff'::app_role
    WHEN p.role = 'admin' THEN 'admin'::app_role
    ELSE 'user'::app_role
  END
FROM public.profiles p
WHERE p.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Fix profile default role
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending';

-- 8. Fix profile policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND (role IS NULL OR role = 'pending'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

-- 9. Fix contracts
DROP POLICY IF EXISTS "HR users can manage contracts" ON public.contracts;
CREATE POLICY "HR staff can manage contracts"
ON public.contracts FOR ALL TO authenticated
USING (public.is_hr_user()) WITH CHECK (public.is_hr_user());

-- 10. Fix employees
DROP POLICY IF EXISTS "HR users can view all employees" ON public.employees;
DROP POLICY IF EXISTS "HR users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "HR users can update employees" ON public.employees;

CREATE POLICY "HR staff can view employees"
ON public.employees FOR SELECT TO authenticated USING (public.is_hr_user());
CREATE POLICY "HR staff can insert employees"
ON public.employees FOR INSERT TO authenticated WITH CHECK (public.is_hr_user());
CREATE POLICY "HR staff can update employees"
ON public.employees FOR UPDATE TO authenticated USING (public.is_hr_user());

-- 11. Fix companies
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON public.companies;

CREATE POLICY "HR staff can view companies"
ON public.companies FOR SELECT TO authenticated USING (public.is_hr_user());
CREATE POLICY "HR staff can insert companies"
ON public.companies FOR INSERT TO authenticated WITH CHECK (public.is_hr_user());
CREATE POLICY "HR staff can update companies"
ON public.companies FOR UPDATE TO authenticated USING (public.is_hr_user());
CREATE POLICY "HR staff can delete companies"
ON public.companies FOR DELETE TO authenticated USING (public.is_hr_user());

-- 12. Fix invitations
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "HR users can view all invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR users can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR users can update invitations" ON public.invitations;

CREATE POLICY "HR staff can view invitations"
ON public.invitations FOR SELECT TO authenticated USING (public.is_hr_user());
CREATE POLICY "HR staff can insert invitations"
ON public.invitations FOR INSERT TO authenticated WITH CHECK (public.is_hr_user());
CREATE POLICY "HR staff can update invitations"
ON public.invitations FOR UPDATE TO authenticated USING (public.is_hr_user());
