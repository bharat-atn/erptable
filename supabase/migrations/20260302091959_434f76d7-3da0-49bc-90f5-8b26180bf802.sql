
-- Create issue_reports table
CREATE TABLE public.issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid,
  reporter_email text,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  title text NOT NULL,
  description text NOT NULL,
  screenshot_url text,
  attachment_urls jsonb DEFAULT '[]'::jsonb,
  current_page text,
  browser_info text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  admin_notes text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Reporters can insert their own reports
CREATE POLICY "Users can insert own reports"
  ON public.issue_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Reporters can view own reports
CREATE POLICY "Users can view own reports"
  ON public.issue_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins/HR can view all org reports
CREATE POLICY "Admins can view all org reports"
  ON public.issue_reports FOR SELECT
  USING (
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'org_admin'::app_role) OR has_role(auth.uid(), 'hr_manager'::app_role))
    AND is_org_member_current(org_id)
  );

-- Admins can update reports (triage/resolve)
CREATE POLICY "Admins can update reports"
  ON public.issue_reports FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND is_org_member_current(org_id)
  );

-- Admins can delete reports
CREATE POLICY "Admins can delete reports"
  ON public.issue_reports FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    AND is_org_member_current(org_id)
  );

-- Updated_at trigger
CREATE TRIGGER update_issue_reports_updated_at
  BEFORE UPDATE ON public.issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-screenshots', 'issue-screenshots', true);

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload issue screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'issue-screenshots' AND auth.role() = 'authenticated');

-- Anyone can read (public bucket)
CREATE POLICY "Public read issue screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-screenshots');

-- Admins can delete screenshots
CREATE POLICY "Admins can delete issue screenshots"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'issue-screenshots' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
