
-- 1. Add server-side JSONB validation to submit_onboarding
CREATE OR REPLACE FUNCTION public.submit_onboarding(_token text, _first_name text, _middle_name text, _last_name text, _personal_info jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _invitation record;
BEGIN
  -- Token validation
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  -- Name field length validation
  IF length(_first_name) > 100 OR length(_last_name) > 100 OR length(coalesce(_middle_name, '')) > 100 THEN
    RAISE EXCEPTION 'Name fields must be under 100 characters';
  END IF;

  -- JSONB size validation (max 50KB)
  IF pg_column_size(_personal_info) > 50000 THEN
    RAISE EXCEPTION 'Personal info payload too large';
  END IF;

  -- JSONB depth/key count validation
  IF (SELECT count(*) FROM jsonb_object_keys(_personal_info)) > 50 THEN
    RAISE EXCEPTION 'Too many fields in personal info';
  END IF;

  -- Validate individual field lengths within JSONB (prevent oversized string values)
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

  INSERT INTO contracts (employee_id, season_year)
  VALUES (_invitation.employee_id, extract(year from now())::text);
END;
$function$;

-- 2. Fix signatures storage: remove the overly permissive upload policy
DROP POLICY IF EXISTS "Anyone can upload to signatures with valid path" ON storage.objects;

-- Keep the HR upload policy and public read (needed for contract rendering per memory)
