
-- ============================================================
-- STEP 3: Rewrite all RLS policies with org_id scoping
-- ============================================================

-- Helper: drop + recreate pattern for each table

-- === EMPLOYEES ===
DROP POLICY IF EXISTS "HR staff can view employees" ON public.employees;
DROP POLICY IF EXISTS "HR staff can insert employees" ON public.employees;
DROP POLICY IF EXISTS "HR staff can update employees" ON public.employees;
DROP POLICY IF EXISTS "HR staff can delete employees" ON public.employees;

CREATE POLICY "HR staff can view employees" ON public.employees FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert employees" ON public.employees FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update employees" ON public.employees FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete employees" ON public.employees FOR DELETE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === INVITATIONS ===
DROP POLICY IF EXISTS "HR staff can view invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR staff can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR staff can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "HR staff can delete invitations" ON public.invitations;

CREATE POLICY "HR staff can view invitations" ON public.invitations FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert invitations" ON public.invitations FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update invitations" ON public.invitations FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete invitations" ON public.invitations FOR DELETE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === CONTRACTS ===
DROP POLICY IF EXISTS "HR staff can manage contracts" ON public.contracts;

CREATE POLICY "HR staff can manage contracts" ON public.contracts FOR ALL TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id))
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

-- === CONTRACT_SCHEDULES ===
DROP POLICY IF EXISTS "HR staff can manage contract_schedules" ON public.contract_schedules;

CREATE POLICY "HR staff can manage contract_schedules" ON public.contract_schedules FOR ALL TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id))
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

-- === COMPANIES ===
DROP POLICY IF EXISTS "HR staff can view companies" ON public.companies;
DROP POLICY IF EXISTS "HR staff can insert companies" ON public.companies;
DROP POLICY IF EXISTS "HR staff can update companies" ON public.companies;
DROP POLICY IF EXISTS "HR staff can delete companies" ON public.companies;

CREATE POLICY "HR staff can view companies" ON public.companies FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert companies" ON public.companies FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update companies" ON public.companies FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete companies" ON public.companies FOR DELETE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === POSITIONS ===
DROP POLICY IF EXISTS "HR staff can view positions" ON public.positions;
DROP POLICY IF EXISTS "HR staff can insert positions" ON public.positions;
DROP POLICY IF EXISTS "HR staff can update positions" ON public.positions;
DROP POLICY IF EXISTS "HR staff can delete positions" ON public.positions;

CREATE POLICY "HR staff can view positions" ON public.positions FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert positions" ON public.positions FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update positions" ON public.positions FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete positions" ON public.positions FOR DELETE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === SKILL_GROUPS ===
DROP POLICY IF EXISTS "HR staff can view skill_groups" ON public.skill_groups;
DROP POLICY IF EXISTS "HR staff can insert skill_groups" ON public.skill_groups;
DROP POLICY IF EXISTS "HR staff can update skill_groups" ON public.skill_groups;
DROP POLICY IF EXISTS "HR staff can delete skill_groups" ON public.skill_groups;

CREATE POLICY "HR staff can view skill_groups" ON public.skill_groups FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert skill_groups" ON public.skill_groups FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update skill_groups" ON public.skill_groups FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete skill_groups" ON public.skill_groups FOR DELETE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === AGREEMENT_PERIODS ===
DROP POLICY IF EXISTS "HR staff can view agreement_periods" ON public.agreement_periods;
DROP POLICY IF EXISTS "HR staff can insert agreement_periods" ON public.agreement_periods;
DROP POLICY IF EXISTS "HR staff can update agreement_periods" ON public.agreement_periods;
DROP POLICY IF EXISTS "HR staff can delete agreement_periods" ON public.agreement_periods;

CREATE POLICY "HR staff can view agreement_periods" ON public.agreement_periods FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert agreement_periods" ON public.agreement_periods FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update agreement_periods" ON public.agreement_periods FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete agreement_periods" ON public.agreement_periods FOR DELETE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === BANKS ===
DROP POLICY IF EXISTS "Anyone can read active banks" ON public.banks;
DROP POLICY IF EXISTS "HR staff can view banks" ON public.banks;
DROP POLICY IF EXISTS "HR staff can insert banks" ON public.banks;
DROP POLICY IF EXISTS "HR staff can update banks" ON public.banks;
DROP POLICY IF EXISTS "HR staff can delete banks" ON public.banks;

CREATE POLICY "HR staff can view banks" ON public.banks FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "Anyone can read active banks" ON public.banks FOR SELECT TO authenticated
USING (is_active = true AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert banks" ON public.banks FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update banks" ON public.banks FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete banks" ON public.banks FOR DELETE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === INVITATION_TEMPLATE_FIELDS ===
DROP POLICY IF EXISTS "Anyone can read invitation_template_fields" ON public.invitation_template_fields;
DROP POLICY IF EXISTS "HR staff can view invitation_template_fields" ON public.invitation_template_fields;
DROP POLICY IF EXISTS "HR staff can insert invitation_template_fields" ON public.invitation_template_fields;
DROP POLICY IF EXISTS "HR staff can update invitation_template_fields" ON public.invitation_template_fields;

CREATE POLICY "Anyone can read invitation_template_fields" ON public.invitation_template_fields FOR SELECT
USING (true);

CREATE POLICY "HR staff can insert invitation_template_fields" ON public.invitation_template_fields FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update invitation_template_fields" ON public.invitation_template_fields FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === EMPLOYEE_ID_SETTINGS ===
DROP POLICY IF EXISTS "HR staff can view employee_id_settings" ON public.employee_id_settings;
DROP POLICY IF EXISTS "HR staff can insert employee_id_settings" ON public.employee_id_settings;
DROP POLICY IF EXISTS "HR staff can update employee_id_settings" ON public.employee_id_settings;

CREATE POLICY "HR staff can view employee_id_settings" ON public.employee_id_settings FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert employee_id_settings" ON public.employee_id_settings FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update employee_id_settings" ON public.employee_id_settings FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === CONTRACT_ID_SETTINGS ===
DROP POLICY IF EXISTS "HR staff can view contract_id_settings" ON public.contract_id_settings;
DROP POLICY IF EXISTS "HR staff can insert contract_id_settings" ON public.contract_id_settings;
DROP POLICY IF EXISTS "HR staff can update contract_id_settings" ON public.contract_id_settings;

CREATE POLICY "HR staff can view contract_id_settings" ON public.contract_id_settings FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert contract_id_settings" ON public.contract_id_settings FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update contract_id_settings" ON public.contract_id_settings FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === CONTRACT_ID_YEAR_COUNTERS ===
DROP POLICY IF EXISTS "HR staff can view contract_id_year_counters" ON public.contract_id_year_counters;
DROP POLICY IF EXISTS "HR staff can insert contract_id_year_counters" ON public.contract_id_year_counters;
DROP POLICY IF EXISTS "HR staff can update contract_id_year_counters" ON public.contract_id_year_counters;

CREATE POLICY "HR staff can view contract_id_year_counters" ON public.contract_id_year_counters FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert contract_id_year_counters" ON public.contract_id_year_counters FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update contract_id_year_counters" ON public.contract_id_year_counters FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === APP_LAUNCHER_CONFIG ===
DROP POLICY IF EXISTS "HR staff can view app_launcher_config" ON public.app_launcher_config;
DROP POLICY IF EXISTS "HR staff can insert app_launcher_config" ON public.app_launcher_config;
DROP POLICY IF EXISTS "HR staff can update app_launcher_config" ON public.app_launcher_config;

CREATE POLICY "HR staff can view app_launcher_config" ON public.app_launcher_config FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert app_launcher_config" ON public.app_launcher_config FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update app_launcher_config" ON public.app_launcher_config FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === AUDIT_LOG ===
DROP POLICY IF EXISTS "Admins can view audit_log" ON public.audit_log;

CREATE POLICY "Admins can view audit_log" ON public.audit_log FOR SELECT TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role))
  AND is_org_member_current(org_id)
);

-- === APP_VERSIONS ===
DROP POLICY IF EXISTS "HR staff can view app_versions" ON public.app_versions;
DROP POLICY IF EXISTS "HR staff can insert app_versions" ON public.app_versions;
DROP POLICY IF EXISTS "HR staff can update app_versions" ON public.app_versions;

CREATE POLICY "HR staff can view app_versions" ON public.app_versions FOR SELECT TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert app_versions" ON public.app_versions FOR INSERT TO authenticated
WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update app_versions" ON public.app_versions FOR UPDATE TO authenticated
USING (is_hr_user() AND is_org_member_current(org_id));

-- === Update audit_trigger_func to capture org_id from session ===
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _summary text;
  _record_id text;
  _old_data jsonb;
  _new_data jsonb;
  _org_id uuid;
BEGIN
  _user_id := auth.uid();
  
  SELECT email INTO _user_email
  FROM auth.users WHERE id = _user_id;

  -- Capture org_id from the row itself (all data tables now have org_id)
  BEGIN
    IF TG_OP = 'DELETE' THEN
      _org_id := OLD.org_id;
    ELSE
      _org_id := NEW.org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to session variable
    BEGIN
      _org_id := current_setting('app.current_org_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
      _org_id := NULL;
    END;
  END;

  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _old_data := to_jsonb(OLD);
    _old_data := _old_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data, org_id)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _old_data, _org_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
    _old_data := _old_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    _new_data := _new_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data, new_data, org_id)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _old_data, _new_data, _org_id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _new_data := to_jsonb(NEW);
    _new_data := _new_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, new_data, org_id)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _new_data, _org_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;
