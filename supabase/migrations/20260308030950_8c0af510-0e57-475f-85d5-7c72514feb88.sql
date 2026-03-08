
-- Table for saving column mapping presets per organization
CREATE TABLE public.import_mapping_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  mappings jsonb NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_mapping_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view import_mapping_presets"
  ON public.import_mapping_presets FOR SELECT
  USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert import_mapping_presets"
  ON public.import_mapping_presets FOR INSERT
  WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update import_mapping_presets"
  ON public.import_mapping_presets FOR UPDATE
  USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete import_mapping_presets"
  ON public.import_mapping_presets FOR DELETE
  USING (is_hr_user() AND is_org_member_current(org_id));

-- Table for saving import drafts per organization
CREATE TABLE public.import_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Import',
  step integer NOT NULL DEFAULT 1,
  file_name text,
  raw_headers jsonb DEFAULT '[]',
  mappings jsonb DEFAULT '{}',
  mapped_data jsonb DEFAULT '[]',
  row_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view import_drafts"
  ON public.import_drafts FOR SELECT
  USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert import_drafts"
  ON public.import_drafts FOR INSERT
  WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update import_drafts"
  ON public.import_drafts FOR UPDATE
  USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete import_drafts"
  ON public.import_drafts FOR DELETE
  USING (is_hr_user() AND is_org_member_current(org_id));

-- Auto-set org_id triggers
CREATE TRIGGER set_org_id_import_mapping_presets
  BEFORE INSERT ON public.import_mapping_presets
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();

CREATE TRIGGER set_org_id_import_drafts
  BEFORE INSERT ON public.import_drafts
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_id();
