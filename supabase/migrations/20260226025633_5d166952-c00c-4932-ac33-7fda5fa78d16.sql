
-- Create role_app_access table
CREATE TABLE public.role_app_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  app_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (role, app_id)
);

-- Enable RLS
ALTER TABLE public.role_app_access ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (need to check their own role's access)
CREATE POLICY "Authenticated users can read role_app_access"
ON public.role_app_access
FOR SELECT
TO authenticated
USING (true);

-- Only admin can insert
CREATE POLICY "Admins can insert role_app_access"
ON public.role_app_access
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admin can delete
CREATE POLICY "Admins can delete role_app_access"
ON public.role_app_access
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with current defaults
INSERT INTO public.role_app_access (role, app_id) VALUES
  ('admin', 'hr-management'),
  ('org_admin', 'hr-management'),
  ('hr_manager', 'hr-management'),
  ('admin', 'user-management'),
  ('admin', 'forestry-project'),
  ('org_admin', 'forestry-project'),
  ('project_manager', 'forestry-project'),
  ('admin', 'payroll'),
  ('org_admin', 'payroll'),
  ('payroll_manager', 'payroll'),
  ('admin', 'employee-hub'),
  ('org_admin', 'employee-hub'),
  ('hr_manager', 'employee-hub'),
  ('project_manager', 'employee-hub'),
  ('payroll_manager', 'employee-hub'),
  ('team_leader', 'employee-hub'),
  ('user', 'employee-hub');
