
-- 1. Create issue_comments table
CREATE TABLE public.issue_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES public.issue_reports(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  author_id uuid NOT NULL,
  author_email text,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

-- 3. Admins can do everything on comments in their org
CREATE POLICY "Admins can manage issue_comments"
  ON public.issue_comments FOR ALL
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role))
    AND is_org_member_current(org_id)
  )
  WITH CHECK (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role))
    AND is_org_member_current(org_id)
  );

-- 4. Users can read non-internal comments on their own issues
CREATE POLICY "Users can view non-internal comments on own issues"
  ON public.issue_comments FOR SELECT
  USING (
    is_internal = false
    AND EXISTS (
      SELECT 1 FROM public.issue_reports
      WHERE id = issue_id AND reporter_id = auth.uid()
    )
  );

-- 5. Users can insert non-internal comments on their own issues
CREATE POLICY "Users can comment on own issues"
  ON public.issue_comments FOR INSERT
  WITH CHECK (
    is_internal = false
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.issue_reports
      WHERE id = issue_id AND reporter_id = auth.uid()
    )
  );

-- 6. Audit trigger on issue_reports
CREATE TRIGGER audit_issue_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.issue_reports
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 7. Audit trigger on issue_comments
CREATE TRIGGER audit_issue_comments
  AFTER INSERT OR UPDATE OR DELETE ON public.issue_comments
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
