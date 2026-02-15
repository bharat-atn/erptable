
-- Create per-year counters for contract IDs
CREATE TABLE public.contract_id_year_counters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year integer NOT NULL UNIQUE,
  next_number integer NOT NULL DEFAULT 1,
  issued_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_id_year_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view contract_id_year_counters"
  ON public.contract_id_year_counters FOR SELECT
  USING (is_hr_user());

CREATE POLICY "HR staff can update contract_id_year_counters"
  ON public.contract_id_year_counters FOR UPDATE
  USING (is_hr_user());

CREATE POLICY "HR staff can insert contract_id_year_counters"
  ON public.contract_id_year_counters FOR INSERT
  WITH CHECK (is_hr_user());

-- Seed counters for current year + 5 years ahead
INSERT INTO public.contract_id_year_counters (year, next_number, issued_count)
VALUES
  (2026, 1, 0),
  (2027, 1, 0),
  (2028, 1, 0),
  (2029, 1, 0),
  (2030, 1, 0),
  (2031, 1, 0);

-- Trigger to update updated_at
CREATE TRIGGER update_contract_id_year_counters_updated_at
  BEFORE UPDATE ON public.contract_id_year_counters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
