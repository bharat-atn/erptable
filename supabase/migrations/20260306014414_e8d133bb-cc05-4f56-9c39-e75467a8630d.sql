
-- Forestry Projects table
CREATE TABLE public.forestry_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id_display TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'clearing',
  status TEXT NOT NULL DEFAULT 'setup',
  location TEXT,
  client TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2) DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forestry_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view forestry projects"
  ON public.forestry_projects FOR SELECT TO authenticated
  USING (is_org_member_current(org_id));

CREATE POLICY "Org members can insert forestry projects"
  ON public.forestry_projects FOR INSERT TO authenticated
  WITH CHECK (is_org_member_current(org_id));

CREATE POLICY "Org members can update forestry projects"
  ON public.forestry_projects FOR UPDATE TO authenticated
  USING (is_org_member_current(org_id));

CREATE POLICY "Org members can delete forestry projects"
  ON public.forestry_projects FOR DELETE TO authenticated
  USING (is_org_member_current(org_id));

-- Updated_at trigger
CREATE TRIGGER set_forestry_projects_updated_at
  BEFORE UPDATE ON public.forestry_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_forestry_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.forestry_projects
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Forestry Tasks table
CREATE TABLE public.forestry_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.forestry_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forestry_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage forestry tasks"
  ON public.forestry_tasks FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM public.forestry_projects
    WHERE is_org_member_current(org_id)
  ));

-- Updated_at trigger
CREATE TRIGGER set_forestry_tasks_updated_at
  BEFORE UPDATE ON public.forestry_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
