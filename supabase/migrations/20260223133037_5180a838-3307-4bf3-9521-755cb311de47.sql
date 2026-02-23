
-- Drop existing INSERT trigger for employee code generation
DROP TRIGGER IF EXISTS trg_generate_employee_code ON public.employees;

-- Recreate the trigger to fire on UPDATE when status changes to ACTIVE
CREATE OR REPLACE FUNCTION public.generate_employee_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _prefix text;
  _sep text;
  _next integer;
  _pad integer;
  _settings_id uuid;
BEGIN
  -- Only generate when status is being set to ACTIVE and no code exists yet
  IF NEW.status != 'ACTIVE' OR NEW.employee_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Read config
  SELECT id, prefix, separator, next_number, padding
  INTO _settings_id, _prefix, _sep, _next, _pad
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
  IF _settings_id IS NOT NULL THEN
    UPDATE public.employee_id_settings SET next_number = _next + 1 WHERE id = _settings_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on UPDATE instead of INSERT
CREATE TRIGGER trg_generate_employee_code
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_employee_code();

-- Clear employee codes for non-ACTIVE employees (they shouldn't have one yet)
UPDATE public.employees SET employee_code = NULL WHERE status != 'ACTIVE';

-- Reset the counter since we cleared the codes
UPDATE public.employee_id_settings SET next_number = 1;
