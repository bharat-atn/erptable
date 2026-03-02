
CREATE TABLE public.issue_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  issue_id uuid REFERENCES public.issue_reports(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  update_type text NOT NULL DEFAULT 'info',
  visibility text NOT NULL DEFAULT 'internal',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage issue_updates"
  ON public.issue_updates
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND is_org_member_current(org_id))
  WITH CHECK (has_role(auth.uid(), 'admin') AND is_org_member_current(org_id));

-- HR managers can read all
CREATE POLICY "HR managers can view issue_updates"
  ON public.issue_updates
  FOR SELECT
  TO authenticated
  USING ((has_role(auth.uid(), 'hr_manager') OR has_role(auth.uid(), 'org_admin')) AND is_org_member_current(org_id));

-- Validation trigger for update_type and visibility
CREATE OR REPLACE FUNCTION public.validate_issue_update_fields()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  IF NEW.update_type NOT IN ('fix', 'improvement', 'info', 'known_issue', 'workaround') THEN
    RAISE EXCEPTION 'Invalid update_type: %', NEW.update_type;
  END IF;
  IF NEW.visibility NOT IN ('internal', 'public') THEN
    RAISE EXCEPTION 'Invalid visibility: %', NEW.visibility;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_issue_update_fields_trigger
  BEFORE INSERT OR UPDATE ON public.issue_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_issue_update_fields();
