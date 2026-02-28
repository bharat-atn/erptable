
-- Step 1: Add current_org_id to profiles for durable org context
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_current_org_id ON public.profiles(current_org_id);

-- Step 2: Create get_current_org_id() helper
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT current_org_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Step 3: Create is_org_active() - NO super-admin bypass
CREATE OR REPLACE FUNCTION public.is_org_active(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT get_current_org_id() = _org_id
$$;

-- Step 4: Update set_org_context to persist to profiles
CREATE OR REPLACE FUNCTION public.set_org_context(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Super admins can access any org
  IF is_super_admin() THEN
    UPDATE public.profiles SET current_org_id = _org_id WHERE user_id = auth.uid();
    PERFORM set_config('app.current_org_id', _org_id::text, true);
    RETURN;
  END IF;

  -- Verify membership
  IF NOT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of organization %', _org_id;
  END IF;

  UPDATE public.profiles SET current_org_id = _org_id WHERE user_id = auth.uid();
  PERFORM set_config('app.current_org_id', _org_id::text, true);
END;
$$;

-- Step 5: Update is_org_member_current to use durable context
CREATE OR REPLACE FUNCTION public.is_org_member_current(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    is_super_admin()
    OR (
      get_current_org_id() = _org_id
    )
$$;
