
-- Project ID settings table
CREATE TABLE public.project_id_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL DEFAULT 'PJ',
  separator TEXT NOT NULL DEFAULT '-',
  include_year BOOLEAN NOT NULL DEFAULT true,
  padding INTEGER NOT NULL DEFAULT 4,
  next_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_id_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view project_id_settings"
  ON public.project_id_settings FOR SELECT TO authenticated
  USING (public.is_org_member_current(org_id));

CREATE POLICY "Org members can insert project_id_settings"
  ON public.project_id_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member_current(org_id));

CREATE POLICY "Org members can update project_id_settings"
  ON public.project_id_settings FOR UPDATE TO authenticated
  USING (public.is_org_member_current(org_id));

CREATE TRIGGER update_project_id_settings_updated_at
  BEFORE UPDATE ON public.project_id_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Project ID year counters
CREATE TABLE public.project_id_year_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  issued_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (org_id, year)
);

ALTER TABLE public.project_id_year_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view project_id_year_counters"
  ON public.project_id_year_counters FOR SELECT TO authenticated
  USING (public.is_org_member_current(org_id));

CREATE POLICY "Org members can insert project_id_year_counters"
  ON public.project_id_year_counters FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member_current(org_id));

CREATE POLICY "Org members can update project_id_year_counters"
  ON public.project_id_year_counters FOR UPDATE TO authenticated
  USING (public.is_org_member_current(org_id));

CREATE TRIGGER update_project_id_year_counters_updated_at
  BEFORE UPDATE ON public.project_id_year_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed year counters for current + 5 future years for all orgs that have forestry projects
-- We'll handle seeding in the component instead to keep it dynamic
