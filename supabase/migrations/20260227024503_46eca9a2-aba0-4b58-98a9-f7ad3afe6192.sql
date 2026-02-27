
-- Create role_sidebar_access table
CREATE TABLE public.role_sidebar_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  app_id text NOT NULL,
  menu_item_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, app_id, menu_item_id)
);

ALTER TABLE public.role_sidebar_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage role_sidebar_access"
  ON public.role_sidebar_access FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read
CREATE POLICY "Authenticated users can read role_sidebar_access"
  ON public.role_sidebar_access FOR SELECT
  USING (true);

-- Seed defaults: HR Management app
-- All menu items for admin
INSERT INTO public.role_sidebar_access (role, app_id, menu_item_id) VALUES
  -- Admin gets everything for hr-management
  ('admin', 'hr-management', 'dashboard'),
  ('admin', 'hr-management', 'operations'),
  ('admin', 'hr-management', 'invitations'),
  ('admin', 'hr-management', 'contracts'),
  ('admin', 'hr-management', 'contract-template'),
  ('admin', 'hr-management', 'invitation-template'),
  ('admin', 'hr-management', 'contract-data'),
  ('admin', 'hr-management', 'bank-list'),
  ('admin', 'hr-management', 'employee-register'),
  ('admin', 'hr-management', 'company-register'),
  ('admin', 'hr-management', 'employee-id-settings'),
  ('admin', 'hr-management', 'contract-id-settings'),
  ('admin', 'hr-management', 'iso-standards'),
  ('admin', 'hr-management', 'version-management'),
  ('admin', 'hr-management', 'process-guide'),
  ('admin', 'hr-management', 'audit-log'),
  -- org_admin gets everything for hr-management
  ('org_admin', 'hr-management', 'dashboard'),
  ('org_admin', 'hr-management', 'operations'),
  ('org_admin', 'hr-management', 'invitations'),
  ('org_admin', 'hr-management', 'contracts'),
  ('org_admin', 'hr-management', 'contract-template'),
  ('org_admin', 'hr-management', 'invitation-template'),
  ('org_admin', 'hr-management', 'contract-data'),
  ('org_admin', 'hr-management', 'bank-list'),
  ('org_admin', 'hr-management', 'employee-register'),
  ('org_admin', 'hr-management', 'company-register'),
  ('org_admin', 'hr-management', 'employee-id-settings'),
  ('org_admin', 'hr-management', 'contract-id-settings'),
  ('org_admin', 'hr-management', 'iso-standards'),
  ('org_admin', 'hr-management', 'version-management'),
  ('org_admin', 'hr-management', 'process-guide'),
  ('org_admin', 'hr-management', 'audit-log'),
  -- hr_manager gets main + some settings
  ('hr_manager', 'hr-management', 'dashboard'),
  ('hr_manager', 'hr-management', 'operations'),
  ('hr_manager', 'hr-management', 'invitations'),
  ('hr_manager', 'hr-management', 'contracts'),
  ('hr_manager', 'hr-management', 'contract-template'),
  ('hr_manager', 'hr-management', 'invitation-template'),
  ('hr_manager', 'hr-management', 'contract-data'),
  ('hr_manager', 'hr-management', 'bank-list'),
  ('hr_manager', 'hr-management', 'employee-register'),
  ('hr_manager', 'hr-management', 'company-register'),
  ('hr_manager', 'hr-management', 'process-guide'),
  -- project_manager gets dashboard only
  ('project_manager', 'hr-management', 'dashboard'),
  ('project_manager', 'hr-management', 'operations'),
  -- payroll_manager gets dashboard + employee register
  ('payroll_manager', 'hr-management', 'dashboard'),
  ('payroll_manager', 'hr-management', 'employee-register'),
  -- team_leader gets dashboard
  ('team_leader', 'hr-management', 'dashboard'),
  -- user gets dashboard
  ('user', 'hr-management', 'dashboard'),
  -- User Management app: admin gets all sidebar items
  ('admin', 'user-management', 'user-management'),
  ('admin', 'user-management', 'role-permissions'),
  ('admin', 'user-management', 'audit-log'),
  ('admin', 'user-management', 'settings');
