
-- Weekly attendance reports submitted by team leaders
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  project_id uuid NOT NULL REFERENCES public.forestry_projects(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL,
  week_start date NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, project_id, week_start)
);

-- Individual attendance per employee per day
CREATE TABLE public.attendance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  worked boolean NOT NULL DEFAULT false,
  hours numeric DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, employee_id, work_date)
);

-- Progress entries per object per week
CREATE TABLE public.progress_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  object_id uuid NOT NULL REFERENCES public.forestry_objects(id) ON DELETE CASCADE,
  completion_pct numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id, object_id)
);

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_entries ENABLE ROW LEVEL SECURITY;

-- Weekly reports policies
CREATE POLICY "Org members can view weekly_reports"
  ON public.weekly_reports FOR SELECT TO authenticated
  USING (is_org_member_current(org_id));

CREATE POLICY "Org members can insert weekly_reports"
  ON public.weekly_reports FOR INSERT TO authenticated
  WITH CHECK (is_org_member_current(org_id));

CREATE POLICY "Org members can update weekly_reports"
  ON public.weekly_reports FOR UPDATE TO authenticated
  USING (is_org_member_current(org_id));

CREATE POLICY "Org members can delete weekly_reports"
  ON public.weekly_reports FOR DELETE TO authenticated
  USING (is_org_member_current(org_id));

-- Attendance entries: access through report's org
CREATE POLICY "Access attendance via report"
  ON public.attendance_entries FOR ALL TO authenticated
  USING (report_id IN (SELECT id FROM public.weekly_reports WHERE is_org_member_current(org_id)))
  WITH CHECK (report_id IN (SELECT id FROM public.weekly_reports WHERE is_org_member_current(org_id)));

-- Progress entries: access through report's org
CREATE POLICY "Access progress via report"
  ON public.progress_entries FOR ALL TO authenticated
  USING (report_id IN (SELECT id FROM public.weekly_reports WHERE is_org_member_current(org_id)))
  WITH CHECK (report_id IN (SELECT id FROM public.weekly_reports WHERE is_org_member_current(org_id)));

-- Updated_at triggers
CREATE TRIGGER update_weekly_reports_updated_at
  BEFORE UPDATE ON public.weekly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_entries_updated_at
  BEFORE UPDATE ON public.attendance_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_entries_updated_at
  BEFORE UPDATE ON public.progress_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_weekly_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.weekly_reports FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_attendance_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance_entries FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_progress_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.progress_entries FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
