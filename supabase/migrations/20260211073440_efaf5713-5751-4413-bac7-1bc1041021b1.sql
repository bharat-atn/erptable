
-- Settings table for employee ID configuration
CREATE TABLE public.employee_id_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix text NOT NULL DEFAULT 'EPM',
  separator text NOT NULL DEFAULT '-',
  next_number integer NOT NULL DEFAULT 1,
  padding integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_id_settings ENABLE ROW LEVEL SECURITY;

-- Only HR users can view/manage
CREATE POLICY "HR staff can view employee_id_settings"
  ON public.employee_id_settings FOR SELECT
  USING (is_hr_user());

CREATE POLICY "HR staff can update employee_id_settings"
  ON public.employee_id_settings FOR UPDATE
  USING (is_hr_user());

CREATE POLICY "HR staff can insert employee_id_settings"
  ON public.employee_id_settings FOR INSERT
  WITH CHECK (is_hr_user());

-- Timestamp trigger
CREATE TRIGGER update_employee_id_settings_updated_at
  BEFORE UPDATE ON public.employee_id_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a default row
INSERT INTO public.employee_id_settings (prefix, separator, next_number, padding)
VALUES ('EPM', '-', 1, 3);

-- Update the employee code trigger to use the settings table
CREATE OR REPLACE FUNCTION public.generate_employee_code()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  _prefix text;
  _sep text;
  _next integer;
  _pad integer;
BEGIN
  -- Read config
  SELECT prefix, separator, next_number, padding
  INTO _prefix, _sep, _next, _pad
  FROM public.employee_id_settings
  LIMIT 1;

  -- Fallback defaults
  IF _prefix IS NULL THEN
    _prefix := 'EPM';
    _sep := '-';
    _next := 1;
    _pad := 3;
  END IF;

  -- Find the actual next number (max of config vs existing codes)
  SELECT GREATEST(
    _next,
    COALESCE(
      MAX(CAST(SUBSTRING(employee_code FROM length(_prefix || _sep) + 1) AS integer)), 0
    ) + 1
  )
  INTO _next
  FROM public.employees
  WHERE employee_code IS NOT NULL
    AND employee_code LIKE _prefix || _sep || '%';

  NEW.employee_code := _prefix || _sep || LPAD(_next::text, _pad, '0');

  -- Advance the counter
  UPDATE public.employee_id_settings SET next_number = _next + 1;

  RETURN NEW;
END;
$function$;
