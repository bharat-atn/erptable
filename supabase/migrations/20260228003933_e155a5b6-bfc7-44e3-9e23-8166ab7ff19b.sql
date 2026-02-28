
-- ============================================================
-- STEP 1: Core multi-tenant tables and security functions
-- ============================================================

-- 1a. Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  org_type text NOT NULL DEFAULT 'production',  -- 'production' | 'sandbox' | 'demo'
  logo_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1b. Org members table
CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',  -- 'owner' | 'admin' | 'member'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);

-- 1c. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- 1d. is_super_admin() — checks if current user has 'admin' role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 1e. set_org_context(org_id) — validates membership then sets session variable
CREATE OR REPLACE FUNCTION public.set_org_context(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Super admins can access any org
  IF is_super_admin() THEN
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

  PERFORM set_config('app.current_org_id', _org_id::text, true);
END;
$$;

-- 1f. is_org_member_current() — checks if org_id matches session variable (with super admin bypass)
CREATE OR REPLACE FUNCTION public.is_org_member_current(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    is_super_admin()
    OR (
      current_setting('app.current_org_id', true) IS NOT NULL
      AND current_setting('app.current_org_id', true)::uuid = _org_id
    )
$$;

-- 1g. RLS policies for organizations
CREATE POLICY "Members can view their organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can insert organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (is_super_admin() OR created_by = auth.uid());

CREATE POLICY "Super admins can update organizations"
ON public.organizations FOR UPDATE
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
      AND org_members.role = 'owner'
  )
);

CREATE POLICY "Super admins can delete organizations"
ON public.organizations FOR DELETE
TO authenticated
USING (is_super_admin());

-- 1h. RLS policies for org_members
CREATE POLICY "Members can view org members"
ON public.org_members FOR SELECT
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can insert members"
ON public.org_members FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org admins can update members"
ON public.org_members FOR UPDATE
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Org admins can delete members"
ON public.org_members FOR DELETE
TO authenticated
USING (
  is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

-- 1i. Updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
