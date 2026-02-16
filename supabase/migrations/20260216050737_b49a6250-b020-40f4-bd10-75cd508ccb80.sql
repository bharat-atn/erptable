
-- Trigger: decrement employee_id_settings.next_number on DELETE of last employee
CREATE OR REPLACE FUNCTION public.on_employee_deleted()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _prefix text;
  _sep text;
  _settings_id uuid;
  _deleted_num integer;
  _max_existing integer;
BEGIN
  -- Only act if the deleted row had an employee_code
  IF OLD.employee_code IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT id, prefix, separator
  INTO _settings_id, _prefix, _sep
  FROM public.employee_id_settings
  LIMIT 1;

  IF _settings_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Extract the numeric part from the deleted code
  BEGIN
    _deleted_num := CAST(SUBSTRING(OLD.employee_code FROM length(_prefix || _sep) + 1) AS integer);
  EXCEPTION WHEN OTHERS THEN
    RETURN OLD;
  END;

  -- Find the current max among remaining employees
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM length(_prefix || _sep) + 1) AS integer)), 0)
  INTO _max_existing
  FROM public.employees
  WHERE employee_code IS NOT NULL
    AND employee_code LIKE _prefix || _sep || '%';

  -- Set next_number to max + 1
  UPDATE public.employee_id_settings
  SET next_number = _max_existing + 1
  WHERE id = _settings_id;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_employee_deleted
  AFTER DELETE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.on_employee_deleted();

-- Trigger: decrement contract_id_year_counters on DELETE of last contract
CREATE OR REPLACE FUNCTION public.on_contract_deleted()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _prefix text;
  _sep text;
  _include_year boolean;
  _pad integer;
  _year integer;
  _code_pattern text;
  _max_existing integer;
BEGIN
  IF OLD.contract_code IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT prefix, separator, include_year, padding
  INTO _prefix, _sep, _include_year, _pad
  FROM public.contract_id_settings
  LIMIT 1;

  IF _prefix IS NULL THEN
    RETURN OLD;
  END IF;

  -- Only handle counter-based codes (not employee-code-based)
  -- Try to extract the year and number
  IF _include_year THEN
    -- Pattern: PREFIX-YEAR-NUMBER
    BEGIN
      _year := CAST(SPLIT_PART(OLD.contract_code, _sep, 2) AS integer);
    EXCEPTION WHEN OTHERS THEN
      RETURN OLD;
    END;

    -- Check if the last part is numeric (counter-based) vs employee code
    DECLARE
      _last_part text;
    BEGIN
      _last_part := SPLIT_PART(OLD.contract_code, _sep, 3);
      -- If it's purely numeric, it's counter-based
      IF _last_part !~ '^\d+$' THEN
        RETURN OLD;
      END IF;
    END;

    -- Find max remaining counter for this year
    SELECT COALESCE(MAX(CAST(SPLIT_PART(contract_code, _sep, 3) AS integer)), 0)
    INTO _max_existing
    FROM public.contracts
    WHERE contract_code IS NOT NULL
      AND contract_code LIKE _prefix || _sep || _year::text || _sep || '%'
      AND SPLIT_PART(contract_code, _sep, 3) ~ '^\d+$';

    UPDATE public.contract_id_year_counters
    SET next_number = _max_existing + 1,
        issued_count = GREATEST(issued_count - 1, 0)
    WHERE year = _year;
  ELSE
    -- Pattern: PREFIX-NUMBER
    DECLARE
      _last_part text;
    BEGIN
      _last_part := SPLIT_PART(OLD.contract_code, _sep, 2);
      IF _last_part !~ '^\d+$' THEN
        RETURN OLD;
      END IF;
    END;

    SELECT COALESCE(MAX(CAST(SPLIT_PART(contract_code, _sep, 2) AS integer)), 0)
    INTO _max_existing
    FROM public.contracts
    WHERE contract_code IS NOT NULL
      AND contract_code LIKE _prefix || _sep || '%'
      AND SPLIT_PART(contract_code, _sep, 2) ~ '^\d+$';

    -- Update the settings next_number
    UPDATE public.contract_id_settings
    SET next_number = _max_existing + 1;
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_contract_deleted
  AFTER DELETE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.on_contract_deleted();
