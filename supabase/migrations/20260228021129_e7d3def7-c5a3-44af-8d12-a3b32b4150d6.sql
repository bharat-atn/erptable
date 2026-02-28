
-- EMPLOYEES: Replace existing policies with split read/write
DROP POLICY IF EXISTS "HR staff can view employees" ON public.employees;
DROP POLICY IF EXISTS "HR staff can insert employees" ON public.employees;
DROP POLICY IF EXISTS "HR staff can update employees" ON public.employees;
DROP POLICY IF EXISTS "HR staff can delete employees" ON public.employees;

-- SELECT: super admins see all, others see active org only
CREATE POLICY "employees_select" ON public.employees FOR SELECT TO authenticated
  USING (is_hr_user() AND (is_super_admin() OR is_org_active(org_id)));

-- INSERT/UPDATE/DELETE: strictly active org only (no super-admin bypass)
CREATE POLICY "employees_insert" ON public.employees FOR INSERT TO authenticated
  WITH CHECK (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "employees_delete" ON public.employees FOR DELETE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));

-- INVITATIONS: Replace existing policies
DROP POLICY IF EXISTS "HR staff can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR staff can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR staff can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR staff can delete invitations" ON public.invitations;

CREATE POLICY "invitations_select" ON public.invitations FOR SELECT TO authenticated
  USING (is_hr_user() AND (is_super_admin() OR is_org_active(org_id)));
CREATE POLICY "invitations_insert" ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "invitations_update" ON public.invitations FOR UPDATE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "invitations_delete" ON public.invitations FOR DELETE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));

-- CONTRACTS: Replace the ALL policy with split policies
DROP POLICY IF EXISTS "HR staff can manage contracts" ON public.contracts;

CREATE POLICY "contracts_select" ON public.contracts FOR SELECT TO authenticated
  USING (is_hr_user() AND (is_super_admin() OR is_org_active(org_id)));
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "contracts_delete" ON public.contracts FOR DELETE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));

-- COMPANIES: Replace existing policies
DROP POLICY IF EXISTS "HR staff can view companies" ON public.companies;
DROP POLICY IF EXISTS "HR staff can insert companies" ON public.companies;
DROP POLICY IF EXISTS "HR staff can update companies" ON public.companies;
DROP POLICY IF EXISTS "HR staff can delete companies" ON public.companies;

CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated
  USING (is_hr_user() AND (is_super_admin() OR is_org_active(org_id)));
CREATE POLICY "companies_insert" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "companies_update" ON public.companies FOR UPDATE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "companies_delete" ON public.companies FOR DELETE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));

-- CONTRACT_SCHEDULES: Replace the ALL policy
DROP POLICY IF EXISTS "HR staff can manage contract_schedules" ON public.contract_schedules;

CREATE POLICY "contract_schedules_select" ON public.contract_schedules FOR SELECT TO authenticated
  USING (is_hr_user() AND (is_super_admin() OR is_org_active(org_id)));
CREATE POLICY "contract_schedules_insert" ON public.contract_schedules FOR INSERT TO authenticated
  WITH CHECK (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "contract_schedules_update" ON public.contract_schedules FOR UPDATE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));
CREATE POLICY "contract_schedules_delete" ON public.contract_schedules FOR DELETE TO authenticated
  USING (is_hr_user() AND is_org_active(org_id));
