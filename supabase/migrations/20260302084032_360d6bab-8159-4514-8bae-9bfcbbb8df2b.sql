CREATE OR REPLACE FUNCTION public.log_auth_event(
  _action text, _user_id uuid, _user_email text, _summary text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
BEGIN
  SELECT current_org_id INTO _org_id
  FROM public.profiles WHERE user_id = _user_id;

  IF _org_id IS NULL THEN
    SELECT org_id INTO _org_id
    FROM public.org_members WHERE user_id = _user_id LIMIT 1;
  END IF;

  IF _org_id IS NULL THEN
    SELECT id INTO _org_id FROM public.organizations LIMIT 1;
  END IF;

  INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, org_id)
  VALUES (_user_id, _user_email, _action, 'auth', _user_id::text,
          COALESCE(_summary, _action || ' by ' || COALESCE(_user_email, 'unknown')),
          _org_id);
END;
$$;