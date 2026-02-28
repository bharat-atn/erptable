
-- ============================================================
-- STEP 2: Add org_id to all data tables + backfill
-- ============================================================

-- 2a. Create a default organization from existing data
INSERT INTO public.organizations (id, name, slug, org_type, created_by)
SELECT 
  gen_random_uuid(),
  COALESCE((SELECT name FROM public.companies LIMIT 1), 'Default Organization'),
  'default-org',
  'production',
  (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1);

-- 2b. Add all existing users as members of the default org
INSERT INTO public.org_members (org_id, user_id, role)
SELECT 
  (SELECT id FROM public.organizations WHERE slug = 'default-org'),
  ur.user_id,
  CASE WHEN ur.role = 'admin' THEN 'owner' ELSE 'member' END
FROM public.user_roles ur
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 2c. Add org_id columns (nullable first for backfill)
ALTER TABLE public.employees ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.invitations ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.contracts ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.contract_schedules ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.companies ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.positions ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.skill_groups ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.agreement_periods ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.banks ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.invitation_template_fields ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.employee_id_settings ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.contract_id_settings ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.contract_id_year_counters ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.app_launcher_config ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.audit_log ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.app_versions ADD COLUMN org_id uuid REFERENCES public.organizations(id);

-- 2d. Backfill all existing rows with the default org
UPDATE public.employees SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.invitations SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.contracts SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.contract_schedules SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.companies SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.positions SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.skill_groups SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.agreement_periods SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.banks SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.invitation_template_fields SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.employee_id_settings SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.contract_id_settings SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.contract_id_year_counters SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.app_launcher_config SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.audit_log SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;
UPDATE public.app_versions SET org_id = (SELECT id FROM public.organizations WHERE slug = 'default-org') WHERE org_id IS NULL;

-- 2e. Make org_id NOT NULL
ALTER TABLE public.employees ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.invitations ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.contracts ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.contract_schedules ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.companies ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.positions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.skill_groups ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.agreement_periods ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.banks ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.invitation_template_fields ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.employee_id_settings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.contract_id_settings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.contract_id_year_counters ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.app_launcher_config ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.audit_log ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.app_versions ALTER COLUMN org_id SET NOT NULL;

-- 2f. Create indexes on org_id for all tables
CREATE INDEX idx_employees_org_id ON public.employees(org_id);
CREATE INDEX idx_invitations_org_id ON public.invitations(org_id);
CREATE INDEX idx_contracts_org_id ON public.contracts(org_id);
CREATE INDEX idx_contract_schedules_org_id ON public.contract_schedules(org_id);
CREATE INDEX idx_companies_org_id ON public.companies(org_id);
CREATE INDEX idx_positions_org_id ON public.positions(org_id);
CREATE INDEX idx_skill_groups_org_id ON public.skill_groups(org_id);
CREATE INDEX idx_agreement_periods_org_id ON public.agreement_periods(org_id);
CREATE INDEX idx_banks_org_id ON public.banks(org_id);
CREATE INDEX idx_invitation_template_fields_org_id ON public.invitation_template_fields(org_id);
CREATE INDEX idx_employee_id_settings_org_id ON public.employee_id_settings(org_id);
CREATE INDEX idx_contract_id_settings_org_id ON public.contract_id_settings(org_id);
CREATE INDEX idx_contract_id_year_counters_org_id ON public.contract_id_year_counters(org_id);
CREATE INDEX idx_app_launcher_config_org_id ON public.app_launcher_config(org_id);
CREATE INDEX idx_audit_log_org_id ON public.audit_log(org_id);
CREATE INDEX idx_app_versions_org_id ON public.app_versions(org_id);

-- 2g. Auto-fill trigger function for org_id from session variable
CREATE OR REPLACE FUNCTION public.auto_set_org_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- If org_id is already set, keep it
  IF NEW.org_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Try to get from session variable
  BEGIN
    _org_id := current_setting('app.current_org_id', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    _org_id := NULL;
  END;

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'No organization context set. Call set_org_context() first.';
  END IF;

  NEW.org_id := _org_id;
  RETURN NEW;
END;
$$;

-- 2h. Attach auto-fill trigger to all data tables
CREATE TRIGGER trg_auto_org_id_employees BEFORE INSERT ON public.employees FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_invitations BEFORE INSERT ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_contracts BEFORE INSERT ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_contract_schedules BEFORE INSERT ON public.contract_schedules FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_companies BEFORE INSERT ON public.companies FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_positions BEFORE INSERT ON public.positions FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_skill_groups BEFORE INSERT ON public.skill_groups FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_agreement_periods BEFORE INSERT ON public.agreement_periods FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_banks BEFORE INSERT ON public.banks FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_invitation_template_fields BEFORE INSERT ON public.invitation_template_fields FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_employee_id_settings BEFORE INSERT ON public.employee_id_settings FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_contract_id_settings BEFORE INSERT ON public.contract_id_settings FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_contract_id_year_counters BEFORE INSERT ON public.contract_id_year_counters FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_app_launcher_config BEFORE INSERT ON public.app_launcher_config FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_audit_log BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
CREATE TRIGGER trg_auto_org_id_app_versions BEFORE INSERT ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
