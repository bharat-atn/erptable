
-- Positions table (with type grouping)
CREATE TABLE public.positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label_en TEXT NOT NULL,
  label_sv TEXT NOT NULL,
  type_number INTEGER NOT NULL DEFAULT 1,
  type_label_en TEXT NOT NULL DEFAULT '',
  type_label_sv TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view positions" ON public.positions FOR SELECT USING (is_hr_user());
CREATE POLICY "HR staff can insert positions" ON public.positions FOR INSERT WITH CHECK (is_hr_user());
CREATE POLICY "HR staff can update positions" ON public.positions FOR UPDATE USING (is_hr_user());
CREATE POLICY "HR staff can delete positions" ON public.positions FOR DELETE USING (is_hr_user());

-- Skill Groups table
CREATE TABLE public.skill_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label_en TEXT NOT NULL,
  label_sv TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view skill_groups" ON public.skill_groups FOR SELECT USING (is_hr_user());
CREATE POLICY "HR staff can insert skill_groups" ON public.skill_groups FOR INSERT WITH CHECK (is_hr_user());
CREATE POLICY "HR staff can update skill_groups" ON public.skill_groups FOR UPDATE USING (is_hr_user());
CREATE POLICY "HR staff can delete skill_groups" ON public.skill_groups FOR DELETE USING (is_hr_user());

-- Agreement Period Mappings (Salaries & Periods)
CREATE TABLE public.agreement_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  skill_group_id UUID NOT NULL REFERENCES public.skill_groups(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL DEFAULT '2026/2027',
  monthly_rate NUMERIC NOT NULL DEFAULT 0,
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agreement_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view agreement_periods" ON public.agreement_periods FOR SELECT USING (is_hr_user());
CREATE POLICY "HR staff can insert agreement_periods" ON public.agreement_periods FOR INSERT WITH CHECK (is_hr_user());
CREATE POLICY "HR staff can update agreement_periods" ON public.agreement_periods FOR UPDATE USING (is_hr_user());
CREATE POLICY "HR staff can delete agreement_periods" ON public.agreement_periods FOR DELETE USING (is_hr_user());

-- Triggers for updated_at
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_skill_groups_updated_at BEFORE UPDATE ON public.skill_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agreement_periods_updated_at BEFORE UPDATE ON public.agreement_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
