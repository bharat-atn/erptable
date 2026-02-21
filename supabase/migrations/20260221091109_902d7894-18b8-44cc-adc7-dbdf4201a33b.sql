
-- Create banks table
CREATE TABLE public.banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bic_code TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on name
ALTER TABLE public.banks ADD CONSTRAINT banks_name_unique UNIQUE (name);

-- Enable RLS
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- HR users can manage banks
CREATE POLICY "HR staff can view banks" ON public.banks FOR SELECT USING (is_hr_user());
CREATE POLICY "HR staff can insert banks" ON public.banks FOR INSERT WITH CHECK (is_hr_user());
CREATE POLICY "HR staff can update banks" ON public.banks FOR UPDATE USING (is_hr_user());
CREATE POLICY "HR staff can delete banks" ON public.banks FOR DELETE USING (is_hr_user());

-- Anyone can read banks (needed for onboarding portal which is unauthenticated)
CREATE POLICY "Anyone can read active banks" ON public.banks FOR SELECT USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON public.banks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with current hardcoded banks
INSERT INTO public.banks (name, country, sort_order) VALUES
  ('BANCA TRANSILVANIA S.A.', 'Romania', 1),
  ('Banca Comercială Română S.A.', 'Romania', 2),
  ('BRD - Groupe Société Générale S.A.', 'Romania', 3),
  ('CEC BANK S.A.', 'Romania', 4),
  ('ING Bank NV, Amsterdam - Bucharest Branch', 'Romania', 5),
  ('UniCredit Bank S.A.', 'Romania', 6),
  ('RAIFFEISEN BANK S.A.', 'Romania', 7);

-- Add audit trigger for banks
CREATE TRIGGER audit_banks
  AFTER INSERT OR UPDATE OR DELETE ON public.banks
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();
