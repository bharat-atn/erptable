
-- Drop and recreate function with language column
DROP FUNCTION IF EXISTS public.get_invitation_by_token(text);

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
 RETURNS TABLE(id uuid, employee_id uuid, type invitation_type, status invitation_status, expires_at timestamp with time zone, employee_email text, employee_first_name text, employee_middle_name text, employee_last_name text, employee_personal_info jsonb, language text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    e.personal_info,
    i.language
  FROM invitations i
  JOIN employees e ON i.employee_id = e.id
  WHERE i.token = _token
    AND i.status NOT IN ('EXPIRED', 'ACCEPTED')
    AND i.expires_at > now()
  LIMIT 1;
END;
$function$;
