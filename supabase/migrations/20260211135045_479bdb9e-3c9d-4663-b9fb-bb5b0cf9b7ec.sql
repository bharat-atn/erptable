
-- Contract ID settings table
CREATE TABLE public.contract_id_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix text NOT NULL DEFAULT 'EC',
  separator text NOT NULL DEFAULT '-',
  include_year boolean NOT NULL DEFAULT true,
  next_number integer NOT NULL DEFAULT 1,
  padding integer NOT NULL DEFAULT 4,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_id_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view contract_id_settings" ON public.contract_id_settings FOR SELECT USING (is_hr_user());
CREATE POLICY "HR staff can update contract_id_settings" ON public.contract_id_settings FOR UPDATE USING (is_hr_user());
CREATE POLICY "HR staff can insert contract_id_settings" ON public.contract_id_settings FOR INSERT WITH CHECK (is_hr_user());

-- Seed default row
INSERT INTO public.contract_id_settings (prefix, separator, include_year, next_number, padding)
VALUES ('EC', '-', true, 1, 4);

-- Add contract_code column to contracts
ALTER TABLE public.contracts ADD COLUMN contract_code text;

-- Add status column for draft/active tracking
ALTER TABLE public.contracts ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- Add company_id to contracts
ALTER TABLE public.contracts ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Add contract form data JSONB for auto-save
ALTER TABLE public.contracts ADD COLUMN form_data jsonb DEFAULT '{}'::jsonb;

-- Trigger to auto-generate contract codes
CREATE OR REPLACE FUNCTION public.generate_contract_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _prefix text;
  _sep text;
  _include_year boolean;
  _next integer;
  _pad integer;
  _settings_id uuid;
  _year text;
  _emp_code text;
BEGIN
  -- Only generate if not already set
  IF NEW.contract_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Read config
  SELECT id, prefix, separator, include_year, next_number, padding
  INTO _settings_id, _prefix, _sep, _include_year, _next, _pad
  FROM public.contract_id_settings
  LIMIT 1;

  -- Fallback defaults
  IF _prefix IS NULL THEN
    _prefix := 'EC';
    _sep := '-';
    _include_year := true;
    _next := 1;
    _pad := 4;
  END IF;

  -- Get employee code
  SELECT employee_code INTO _emp_code
  FROM public.employees
  WHERE id = NEW.employee_id;

  -- Get current year
  _year := extract(year from now())::text;

  -- Build contract code: EC-2026-EPM-001
  IF _include_year AND _emp_code IS NOT NULL THEN
    NEW.contract_code := _prefix || _sep || _year || _sep || _emp_code;
  ELSIF _include_year THEN
    NEW.contract_code := _prefix || _sep || _year || _sep || LPAD(_next::text, _pad, '0');
    IF _settings_id IS NOT NULL THEN
      UPDATE public.contract_id_settings SET next_number = _next + 1 WHERE id = _settings_id;
    END IF;
  ELSE
    NEW.contract_code := _prefix || _sep || LPAD(_next::text, _pad, '0');
    IF _settings_id IS NOT NULL THEN
      UPDATE public.contract_id_settings SET next_number = _next + 1 WHERE id = _settings_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER generate_contract_code_trigger
BEFORE INSERT ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.generate_contract_code();

-- Updated_at trigger for contract_id_settings
CREATE TRIGGER update_contract_id_settings_updated_at
BEFORE UPDATE ON public.contract_id_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
