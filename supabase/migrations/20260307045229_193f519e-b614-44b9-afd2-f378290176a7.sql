
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
  _org_id uuid;
BEGIN
  IF NEW.contract_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.signing_status != 'employer_signed' THEN
    RETURN NEW;
  END IF;

  _org_id := NEW.org_id;

  SELECT prefix, separator, include_year, padding
  INTO _prefix, _sep, _include_year, _pad
  FROM public.contract_id_settings
  WHERE org_id = _org_id
  LIMIT 1;

  IF _prefix IS NULL THEN
    _prefix := 'EC';
    _sep := '-';
    _include_year := true;
    _pad := 4;
  END IF;

  _year := extract(year from now())::integer;
  _year_text := RIGHT(_year::text, 2);

  SELECT employee_code INTO _emp_code
  FROM public.employees
  WHERE id = NEW.employee_id;

  IF _emp_code IS NOT NULL AND _include_year THEN
    NEW.contract_code := _prefix || _sep || _year_text || _sep || _emp_code;
    RETURN NEW;
  ELSIF _emp_code IS NOT NULL THEN
    NEW.contract_code := _prefix || _sep || _emp_code;
    RETURN NEW;
  END IF;

  INSERT INTO public.contract_id_year_counters (org_id, year, next_number, issued_count)
  VALUES (_org_id, _year, 1, 0)
  ON CONFLICT (org_id, year) DO NOTHING;

  SELECT next_number INTO _next
  FROM public.contract_id_year_counters
  WHERE org_id = _org_id AND year = _year
  FOR UPDATE;

  IF _include_year THEN
    NEW.contract_code := _prefix || _sep || _year_text || _sep || LPAD(_next::text, _pad, '0');
  ELSE
    NEW.contract_code := _prefix || _sep || LPAD(_next::text, _pad, '0');
  END IF;

  UPDATE public.contract_id_year_counters
  SET next_number = _next + 1, issued_count = issued_count + 1
  WHERE org_id = _org_id AND year = _year;

  RETURN NEW;
END;
$function$;
