
-- Table: comp_groups
CREATE TABLE public.comp_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'clearing',
  method TEXT NOT NULL DEFAULT 'hourly',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comp_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view comp_groups" ON public.comp_groups FOR SELECT USING (is_org_member_current(org_id));
CREATE POLICY "Org members can insert comp_groups" ON public.comp_groups FOR INSERT WITH CHECK (is_org_member_current(org_id));
CREATE POLICY "Org members can update comp_groups" ON public.comp_groups FOR UPDATE USING (is_org_member_current(org_id));
CREATE POLICY "Org members can delete comp_groups" ON public.comp_groups FOR DELETE USING (is_org_member_current(org_id));

CREATE TRIGGER audit_comp_groups AFTER INSERT OR UPDATE OR DELETE ON public.comp_groups FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER update_comp_groups_updated_at BEFORE UPDATE ON public.comp_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: comp_group_classes
CREATE TABLE public.comp_group_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.comp_groups(id) ON DELETE CASCADE,
  sla_class_id TEXT NOT NULL DEFAULT '104',
  type_label TEXT NOT NULL DEFAULT '',
  client TEXT NOT NULL DEFAULT '',
  star_1 NUMERIC NOT NULL DEFAULT 0,
  star_2 NUMERIC NOT NULL DEFAULT 0,
  star_3 NUMERIC NOT NULL DEFAULT 0,
  star_4 NUMERIC NOT NULL DEFAULT 0,
  star_5 NUMERIC NOT NULL DEFAULT 0,
  hourly_gross NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comp_group_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view comp_group_classes" ON public.comp_group_classes FOR SELECT USING (is_org_member_current(org_id));
CREATE POLICY "Org members can insert comp_group_classes" ON public.comp_group_classes FOR INSERT WITH CHECK (is_org_member_current(org_id));
CREATE POLICY "Org members can update comp_group_classes" ON public.comp_group_classes FOR UPDATE USING (is_org_member_current(org_id));
CREATE POLICY "Org members can delete comp_group_classes" ON public.comp_group_classes FOR DELETE USING (is_org_member_current(org_id));

CREATE TRIGGER audit_comp_group_classes AFTER INSERT OR UPDATE OR DELETE ON public.comp_group_classes FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER update_comp_group_classes_updated_at BEFORE UPDATE ON public.comp_group_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table: comp_group_types
CREATE TABLE public.comp_group_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.comp_groups(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comp_group_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view comp_group_types" ON public.comp_group_types FOR SELECT USING (is_org_member_current(org_id));
CREATE POLICY "Org members can insert comp_group_types" ON public.comp_group_types FOR INSERT WITH CHECK (is_org_member_current(org_id));
CREATE POLICY "Org members can update comp_group_types" ON public.comp_group_types FOR UPDATE USING (is_org_member_current(org_id));
CREATE POLICY "Org members can delete comp_group_types" ON public.comp_group_types FOR DELETE USING (is_org_member_current(org_id));

CREATE TRIGGER audit_comp_group_types AFTER INSERT OR UPDATE OR DELETE ON public.comp_group_types FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER update_comp_group_types_updated_at BEFORE UPDATE ON public.comp_group_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
