-- Update audit_trigger_func to handle tables without org_id (profiles, org_members, user_app_access, etc.)
-- Also mask sensitive profile fields
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
  _org_id uuid;
BEGIN
  _user_id := auth.uid();
  
  SELECT email INTO _user_email
  FROM auth.users WHERE id = _user_id;

  -- Capture org_id from the row itself
  BEGIN
    IF TG_OP = 'DELETE' THEN
      _org_id := OLD.org_id;
    ELSE
      _org_id := NEW.org_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    _org_id := NULL;
  END;

  -- For tables without org_id, try current_org_id from profiles
  IF _org_id IS NULL AND _user_id IS NOT NULL THEN
    BEGIN
      SELECT current_org_id INTO _org_id FROM public.profiles WHERE user_id = _user_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- Fallback to session variable
  IF _org_id IS NULL THEN
    BEGIN
      _org_id := current_setting('app.current_org_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
      _org_id := NULL;
    END;
  END IF;

  -- Last resort fallback
  IF _org_id IS NULL THEN
    SELECT id INTO _org_id FROM public.organizations LIMIT 1;
  END IF;

  -- Sensitive fields to mask
  -- personal_info, signing_token, signature URLs, phone_number, date_of_birth, emergency_contact
  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _old_data := to_jsonb(OLD);
    _old_data := _old_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url' - 'default_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data, org_id)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _old_data, _org_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _old_data := to_jsonb(OLD);
    _new_data := to_jsonb(NEW);
    _old_data := _old_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url' - 'default_signature_url';
    _new_data := _new_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url' - 'default_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data, new_data, org_id)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _old_data, _new_data, _org_id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    _new_data := to_jsonb(NEW);
    _new_data := _new_data - 'personal_info' - 'signing_token' - 'employee_signature_url' - 'employer_signature_url' - 'default_signature_url';
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, new_data, org_id)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, _new_data, _org_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Add audit triggers to tables that don't have them yet

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_org_members
  AFTER INSERT OR UPDATE OR DELETE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_pending_role_assignments
  AFTER INSERT OR UPDATE OR DELETE ON public.pending_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_app_access
  AFTER INSERT OR UPDATE OR DELETE ON public.user_app_access
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_role_app_access
  AFTER INSERT OR UPDATE OR DELETE ON public.role_app_access
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_role_sidebar_access
  AFTER INSERT OR UPDATE OR DELETE ON public.role_sidebar_access
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_app_launcher_config
  AFTER INSERT OR UPDATE OR DELETE ON public.app_launcher_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_app_versions
  AFTER INSERT OR UPDATE OR DELETE ON public.app_versions
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_contract_id_year_counters
  AFTER INSERT OR UPDATE OR DELETE ON public.contract_id_year_counters
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();