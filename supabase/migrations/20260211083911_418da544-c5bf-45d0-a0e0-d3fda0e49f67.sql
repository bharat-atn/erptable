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

-- Recreate the trigger
DROP TRIGGER IF EXISTS generate_employee_code_trigger ON public.employees;
CREATE TRIGGER generate_employee_code_trigger
  BEFORE INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_employee_code();