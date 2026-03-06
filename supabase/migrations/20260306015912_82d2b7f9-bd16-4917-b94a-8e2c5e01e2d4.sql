
-- Create forestry_objects table
CREATE TABLE public.forestry_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.forestry_projects(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  object_id_display TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sla_class TEXT NOT NULL DEFAULT 'standard',
  location TEXT,
  area_hectares NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'registered',
  coordinates TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forestry_objects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Org members can view forestry objects"
  ON public.forestry_objects FOR SELECT TO authenticated
  USING (is_org_member_current(org_id));

CREATE POLICY "Org members can insert forestry objects"
  ON public.forestry_objects FOR INSERT TO authenticated
  WITH CHECK (is_org_member_current(org_id));

CREATE POLICY "Org members can update forestry objects"
  ON public.forestry_objects FOR UPDATE TO authenticated
  USING (is_org_member_current(org_id));

CREATE POLICY "Org members can delete forestry objects"
  ON public.forestry_objects FOR DELETE TO authenticated
  USING (is_org_member_current(org_id));

-- Auto-update updated_at
CREATE TRIGGER update_forestry_objects_updated_at
  BEFORE UPDATE ON public.forestry_objects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_forestry_objects
  AFTER INSERT OR UPDATE OR DELETE ON public.forestry_objects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
