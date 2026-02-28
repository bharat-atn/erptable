
CREATE OR REPLACE FUNCTION public.get_onboarding_banks_by_token(_token text)
RETURNS TABLE(name text, bic_code text, country text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  SELECT i.org_id INTO _org_id
  FROM invitations i
  WHERE i.token = _token
    AND i.status NOT IN ('EXPIRED', 'ACCEPTED')
    AND i.expires_at > now()
  LIMIT 1;

  IF _org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  RETURN QUERY
  SELECT b.name, b.bic_code, b.country
  FROM banks b
  WHERE b.org_id = _org_id
    AND b.is_active = true
  ORDER BY b.country, b.sort_order, b.name;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_onboarding_banks_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_onboarding_banks_by_token(text) TO authenticated;
