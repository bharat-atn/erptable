CREATE OR REPLACE FUNCTION public.submit_onboarding(_token text, _first_name text, _middle_name text, _last_name text, _personal_info jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _invitation record;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  IF length(_first_name) > 100 OR length(_last_name) > 100 OR length(coalesce(_middle_name, '')) > 100 THEN
    RAISE EXCEPTION 'Name fields must be under 100 characters';
  END IF;

  IF pg_column_size(_personal_info) > 50000 THEN
    RAISE EXCEPTION 'Personal info payload too large';
  END IF;

  IF (SELECT count(*) FROM jsonb_object_keys(_personal_info)) > 50 THEN
    RAISE EXCEPTION 'Too many fields in personal info';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_each_text(_personal_info) 
    WHERE length(value) > 1000
  ) THEN
    RAISE EXCEPTION 'Individual personal info field value too long';
  END IF;

  SELECT i.id AS inv_id, i.employee_id
  INTO _invitation
  FROM invitations i
  WHERE i.token = _token
    AND i.status NOT IN ('EXPIRED', 'ACCEPTED')
    AND i.expires_at > now();

  IF _invitation IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  UPDATE employees
  SET first_name = _first_name,
      middle_name = _middle_name,
      last_name = _last_name,
      personal_info = _personal_info,
      phone = _personal_info->>'mobilePhone',
      city = _personal_info->>'city',
      country = _personal_info->>'country',
      status = 'ONBOARDING',
      updated_at = now()
  WHERE id = _invitation.employee_id;

  UPDATE invitations
  SET status = 'ACCEPTED'
  WHERE id = _invitation.inv_id;

  -- Only create a contract if one doesn't already exist for this employee
  IF NOT EXISTS (
    SELECT 1 FROM contracts
    WHERE employee_id = _invitation.employee_id
      AND status IN ('draft', 'active')
  ) THEN
    INSERT INTO contracts (employee_id, season_year)
    VALUES (_invitation.employee_id, extract(year from now())::text);
  END IF;
END;
$function$;