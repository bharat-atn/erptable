
CREATE TABLE public.project_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_start_date date,
  project_end_date date,
  work_start_date date,
  work_end_date date,
  daily_hours numeric NOT NULL DEFAULT 8,
  weekly_hours numeric NOT NULL DEFAULT 40,
  start_time text NOT NULL DEFAULT '06:30',
  end_time text NOT NULL DEFAULT '17:00',
  daily_allowance numeric NOT NULL DEFAULT 300,
  transport_cost_per_km numeric NOT NULL DEFAULT 5,
  accommodation_per_night numeric NOT NULL DEFAULT 500,
  bedding_cleaning_per_night numeric NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE public.project_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view project_defaults"
  ON public.project_defaults FOR SELECT
  USING (is_org_member_current(org_id));

CREATE POLICY "Org members can insert project_defaults"
  ON public.project_defaults FOR INSERT
  WITH CHECK (is_org_member_current(org_id));

CREATE POLICY "Org members can update project_defaults"
  ON public.project_defaults FOR UPDATE
  USING (is_org_member_current(org_id));

CREATE TRIGGER update_project_defaults_updated_at
  BEFORE UPDATE ON public.project_defaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_project_defaults
  AFTER INSERT OR UPDATE OR DELETE ON public.project_defaults
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
