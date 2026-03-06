
-- 1) Update get_contract_for_signing with COALESCE fallback chain
CREATE OR REPLACE FUNCTION public.get_contract_for_signing(_token text)
 RETURNS TABLE(contract_id uuid, contract_code text, company_name text, employee_first_name text, employee_last_name text, signing_status text, employee_signed_at timestamp with time zone, employer_signed_at timestamp with time zone, form_data jsonb, company_org_number text, company_address text, company_postcode text, company_city text, employee_email text, employee_phone text, start_date date, end_date date, salary numeric, season_year text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid signing token';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.contract_code,
    COALESCE(co.name, c.form_data->'companySnapshot'->>'name', o.name) AS company_name,
    e.first_name,
    e.last_name,
    c.signing_status,
    c.employee_signed_at,
    c.employer_signed_at,
    c.form_data,
    COALESCE(co.org_number, c.form_data->'companySnapshot'->>'orgNumber', o.org_number) AS company_org_number,
    COALESCE(co.address, c.form_data->'companySnapshot'->>'address', o.address) AS company_address,
    COALESCE(co.postcode, c.form_data->'companySnapshot'->>'postcode', o.postcode) AS company_postcode,
    COALESCE(co.city, c.form_data->'companySnapshot'->>'city', o.city) AS company_city,
    e.email,
    e.phone,
    c.start_date,
    c.end_date,
    c.salary,
    c.season_year
  FROM contracts c
  JOIN employees e ON c.employee_id = e.id
  JOIN organizations o ON c.org_id = o.id
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE c.signing_token = _token
  LIMIT 1;
END;
$function$;

-- 2) Update submit_onboarding to set company_id on new contracts
CREATE OR REPLACE FUNCTION public.submit_onboarding(_token text, _first_name text, _middle_name text, _last_name text, _personal_info jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _invitation record;
  _employee_org_id uuid;
  _default_company_id uuid;
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

  SELECT org_id INTO _employee_org_id
  FROM employees
  WHERE id = _invitation.employee_id;

  -- Resolve default company for this org
  SELECT id INTO _default_company_id
  FROM companies
  WHERE org_id = _employee_org_id
  ORDER BY created_at ASC
  LIMIT 1;

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

  IF NOT EXISTS (
    SELECT 1 FROM contracts
    WHERE employee_id = _invitation.employee_id
      AND status IN ('draft', 'active')
  ) THEN
    INSERT INTO contracts (employee_id, org_id, season_year, company_id)
    VALUES (_invitation.employee_id, _employee_org_id, extract(year from now())::text, _default_company_id);
  END IF;
END;
$function$;

-- 3) Data remediation: create missing company rows from org data
INSERT INTO companies (name, org_id, org_number, address, postcode, city, country, phone, email, website)
SELECT o.name, o.id, o.org_number, o.address, o.postcode, o.city, o.country, o.phone, o.email, o.website
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM companies c WHERE c.org_id = o.id
);

-- 4) Backfill contracts.company_id where null
UPDATE contracts
SET company_id = (
  SELECT c.id FROM companies c
  WHERE c.org_id = contracts.org_id
  ORDER BY c.created_at ASC
  LIMIT 1
)
WHERE company_id IS NULL
  AND EXISTS (SELECT 1 FROM companies c WHERE c.org_id = contracts.org_id);

-- 5) Backfill companySnapshot in form_data for contracts missing it
UPDATE contracts
SET form_data = COALESCE(form_data, '{}'::jsonb) || jsonb_build_object(
  'companySnapshot', jsonb_build_object(
    'name', co.name,
    'orgNumber', co.org_number,
    'address', co.address,
    'postcode', co.postcode,
    'city', co.city
  )
)
FROM companies co
WHERE contracts.company_id = co.id
  AND (contracts.form_data IS NULL OR NOT (contracts.form_data ? 'companySnapshot'));
