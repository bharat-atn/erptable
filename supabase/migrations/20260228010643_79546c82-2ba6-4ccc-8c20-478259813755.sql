
-- 1. Create SECURITY DEFINER helper to check org admin/owner without triggering RLS
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
$$;

-- 2. Drop all existing org_members policies
DROP POLICY IF EXISTS "Members can view org members" ON public.org_members;
DROP POLICY IF EXISTS "Org admins can insert members" ON public.org_members;
DROP POLICY IF EXISTS "Org admins can update members" ON public.org_members;
DROP POLICY IF EXISTS "Org admins can delete members" ON public.org_members;

-- 3. Recreate org_members policies WITHOUT self-referencing subqueries
CREATE POLICY "Members can view org members"
ON public.org_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_super_admin());

CREATE POLICY "Org admins can insert members"
ON public.org_members FOR INSERT TO authenticated
WITH CHECK (is_super_admin() OR is_org_admin(org_id));

CREATE POLICY "Org admins can update members"
ON public.org_members FOR UPDATE TO authenticated
USING (is_super_admin() OR is_org_admin(org_id));

CREATE POLICY "Org admins can delete members"
ON public.org_members FOR DELETE TO authenticated
USING (is_super_admin() OR is_org_admin(org_id));

-- 4. Fix organizations SELECT policy (also references org_members causing recursion)
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

-- Use a SECURITY DEFINER helper to check org membership without recursion
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
  )
$$;

CREATE POLICY "Members can view their organizations"
ON public.organizations FOR SELECT TO authenticated
USING (is_super_admin() OR is_org_member(id));

-- 5. Also fix organizations UPDATE policy which has the same issue
DROP POLICY IF EXISTS "Super admins can update organizations" ON public.organizations;

CREATE POLICY "Super admins can update organizations"
ON public.organizations FOR UPDATE TO authenticated
USING (is_super_admin() OR is_org_admin(id));
