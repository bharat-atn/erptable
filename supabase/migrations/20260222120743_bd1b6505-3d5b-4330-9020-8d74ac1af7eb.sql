
-- Create a security definer function to log auth events
-- This bypasses RLS so it can insert into audit_log
CREATE OR REPLACE FUNCTION public.log_auth_event(_action text, _user_id uuid, _user_email text, _summary text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary)
  VALUES (_user_id, _user_email, _action, 'auth', _user_id::text, COALESCE(_summary, _action || ' by ' || COALESCE(_user_email, 'unknown')));
END;
$$;
