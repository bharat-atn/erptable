
-- RPC: securely fetch invitation by token (anon access)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  employee_id uuid,
  type invitation_type,
  status invitation_status,
  expires_at timestamptz,
  employee_email text,
  employee_first_name text,
  employee_middle_name text,
  employee_last_name text,
  employee_personal_info jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.employee_id,
    i.type,
    i.status,
    i.expires_at,
    e.email,
    e.first_name,
    e.middle_name,
    e.last_name,
    e.personal_info
  FROM invitations i
  JOIN employees e ON i.employee_id = e.id
  WHERE i.token = _token
    AND i.status NOT IN ('EXPIRED', 'ACCEPTED')
    AND i.expires_at > now()
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token TO authenticated;

-- RPC: securely submit onboarding data (anon access, token-validated)
CREATE OR REPLACE FUNCTION public.submit_onboarding(
  _token text,
  _first_name text,
  _middle_name text,
  _last_name text,
  _personal_info jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation record;
BEGIN
  -- Validate token
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  -- Validate input lengths
  IF length(_first_name) > 100 OR length(_last_name) > 100 OR length(coalesce(_middle_name, '')) > 100 THEN
    RAISE EXCEPTION 'Name fields must be under 100 characters';
  END IF;

  -- Find valid invitation
  SELECT i.id AS inv_id, i.employee_id
  INTO _invitation
  FROM invitations i
  WHERE i.token = _token
    AND i.status NOT IN ('EXPIRED', 'ACCEPTED')
    AND i.expires_at > now();

  IF _invitation IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Update employee
  UPDATE employees
  SET first_name = _first_name,
      middle_name = _middle_name,
      last_name = _last_name,
      personal_info = _personal_info,
      status = 'ONBOARDING',
      updated_at = now()
  WHERE id = _invitation.employee_id;

  -- Mark invitation accepted
  UPDATE invitations
  SET status = 'ACCEPTED'
  WHERE id = _invitation.inv_id;

  -- Create contract
  INSERT INTO contracts (employee_id, season_year)
  VALUES (_invitation.employee_id, extract(year from now())::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_onboarding TO anon;
GRANT EXECUTE ON FUNCTION public.submit_onboarding TO authenticated;
