
DROP FUNCTION IF EXISTS public.get_contract_for_signing(text);

CREATE OR REPLACE FUNCTION public.get_contract_for_signing(_token text)
 RETURNS TABLE(contract_id uuid, contract_code text, company_name text, employee_first_name text, employee_last_name text, signing_status text, employee_signed_at timestamp with time zone, employer_signed_at timestamp with time zone, form_data jsonb, company_org_number text, company_address text, company_postcode text, company_city text, employee_email text, employee_phone text, start_date date, end_date date, salary numeric, season_year text, employee_signing_metadata jsonb, employer_signing_metadata jsonb, employee_signature_url text, employer_signature_url text)
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
    c.season_year,
    c.employee_signing_metadata,
    c.employer_signing_metadata,
    c.employee_signature_url,
    c.employer_signature_url
  FROM contracts c
  JOIN employees e ON c.employee_id = e.id
  JOIN organizations o ON c.org_id = o.id
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE c.signing_token = _token
  LIMIT 1;
END;
$function$;
