
-- Update generate_contract_code to use per-year counters
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
  _pad integer;
  _year integer;
  _year_text text;
  _next integer;
  _emp_code text;
BEGIN
  -- Only generate if not already set
  IF NEW.contract_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Read config
  SELECT prefix, separator, include_year, padding
  INTO _prefix, _sep, _include_year, _pad
  FROM public.contract_id_settings
  LIMIT 1;

  -- Fallback defaults
  IF _prefix IS NULL THEN
    _prefix := 'EC';
    _sep := '-';
    _include_year := true;
    _pad := 4;
  END IF;

  _year := extract(year from now())::integer;
  _year_text := _year::text;

  -- Get employee code
  SELECT employee_code INTO _emp_code
  FROM public.employees
  WHERE id = NEW.employee_id;

  -- If employee has a code, use it directly (no counter needed)
  IF _emp_code IS NOT NULL AND _include_year THEN
    NEW.contract_code := _prefix || _sep || _year_text || _sep || _emp_code;
    RETURN NEW;
  ELSIF _emp_code IS NOT NULL THEN
    NEW.contract_code := _prefix || _sep || _emp_code;
    RETURN NEW;
  END IF;

  -- No employee code: use per-year counter
  -- Upsert the year counter row
  INSERT INTO public.contract_id_year_counters (year, next_number, issued_count)
  VALUES (_year, 1, 0)
  ON CONFLICT (year) DO NOTHING;

  -- Lock and get next number
  SELECT next_number INTO _next
  FROM public.contract_id_year_counters
  WHERE year = _year
  FOR UPDATE;

  -- Build code
  IF _include_year THEN
    NEW.contract_code := _prefix || _sep || _year_text || _sep || LPAD(_next::text, _pad, '0');
  ELSE
    NEW.contract_code := _prefix || _sep || LPAD(_next::text, _pad, '0');
  END IF;

  -- Advance counter
  UPDATE public.contract_id_year_counters
  SET next_number = _next + 1, issued_count = issued_count + 1
  WHERE year = _year;

  RETURN NEW;
END;
$function$;
