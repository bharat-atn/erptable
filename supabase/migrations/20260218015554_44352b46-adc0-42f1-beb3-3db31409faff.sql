
-- Create audit_log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  table_name text NOT NULL,
  record_id text,
  summary text, -- human-readable summary
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and hr_admins can view audit logs
CREATE POLICY "Admins can view audit_log"
  ON public.audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr_admin'));

-- System can insert (via trigger with security definer)
-- No direct user inserts allowed

-- Index for performance
CREATE INDEX idx_audit_log_created_at ON public.audit_log (created_at DESC);
CREATE INDEX idx_audit_log_table_name ON public.audit_log (table_name);
CREATE INDEX idx_audit_log_user_id ON public.audit_log (user_id);

-- Create the audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _summary text;
  _record_id text;
BEGIN
  -- Get current user info
  _user_id := auth.uid();
  
  SELECT email INTO _user_email
  FROM auth.users WHERE id = _user_id;

  IF TG_OP = 'DELETE' THEN
    _record_id := OLD.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, old_data, new_data)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := NEW.id::text;
    _summary := TG_OP || ' on ' || TG_TABLE_NAME;
    INSERT INTO public.audit_log (user_id, user_email, action, table_name, record_id, summary, new_data)
    VALUES (_user_id, _user_email, TG_OP, TG_TABLE_NAME, _record_id, _summary, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach triggers to key tables
CREATE TRIGGER audit_employees
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_invitations
  AFTER INSERT OR UPDATE OR DELETE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
