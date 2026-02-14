
DROP FUNCTION IF EXISTS public.get_contract_for_signing(text);

CREATE FUNCTION public.get_contract_for_signing(_token text)
 RETURNS TABLE(
   contract_id uuid, 
   contract_code text, 
   company_name text, 
   employee_first_name text, 
   employee_last_name text, 
   signing_status text, 
   employee_signed_at timestamp with time zone, 
   employer_signed_at timestamp with time zone,
   form_data jsonb,
   company_org_number text,
   company_address text,
   company_postcode text,
   company_city text,
   employee_email text,
   employee_phone text,
   start_date date,
   end_date date,
   salary numeric,
   season_year text
 )
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
    co.name,
    e.first_name,
    e.last_name,
    c.signing_status,
    c.employee_signed_at,
    c.employer_signed_at,
    c.form_data,
    co.org_number,
    co.address,
    co.postcode,
    co.city,
    e.email,
    e.phone,
    c.start_date,
    c.end_date,
    c.salary,
    c.season_year
  FROM contracts c
  JOIN employees e ON c.employee_id = e.id
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE c.signing_token = _token
  LIMIT 1;
END;
$function$;
