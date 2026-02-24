
-- Fix 1: Add missing GRANT EXECUTE for contract signing RPCs (anon + authenticated)
GRANT EXECUTE ON FUNCTION public.get_contract_for_signing(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_contract_for_signing(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.submit_employee_signature(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_employee_signature(text, text) TO authenticated;

-- Fix 2: Update audit_trigger_func to mask sensitive fields before logging
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _user_email text;
  _summary text;
  _record_id text;
  _old_data jsonb;
  _new_data jsonb;
BEGIN
  _user_id := auth.uid();
  
  SELECT email INTO _user_email
  FROM auth.users WHERE id = _user_id;

  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _old_data := to_jsonb(OLD);
    -- Mask sensitive fields
    _old_data := _old_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _old_data);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
    -- Mask sensitive fields
    _old_data := _old_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    _new_data := _new_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data, new_data)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _old_data, _new_data);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _new_data := to_jsonb(NEW);
    -- Mask sensitive fields
    _new_data := _new_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, new_data)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _new_data);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;
