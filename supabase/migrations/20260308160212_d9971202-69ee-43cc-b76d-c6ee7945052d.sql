
-- Add project setup fields to forestry_projects
ALTER TABLE public.forestry_projects
  ADD COLUMN IF NOT EXISTS purchase_order_number text,
  ADD COLUMN IF NOT EXISTS gps_coordinates text,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.forestry_clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS daily_hours numeric DEFAULT 8,
  ADD COLUMN IF NOT EXISTS start_time text DEFAULT '06:30',
  ADD COLUMN IF NOT EXISTS end_time text DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS work_start_date date,
  ADD COLUMN IF NOT EXISTS work_end_date date,
  ADD COLUMN IF NOT EXISTS setup_progress integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS setup_data jsonb DEFAULT '{}'::jsonb;

-- Project team members
CREATE TABLE IF NOT EXISTS public.forestry_project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.forestry_projects(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  star_rating integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, employee_id)
);

ALTER TABLE public.forestry_project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage project members"
  ON public.forestry_project_members FOR ALL
  USING (project_id IN (SELECT id FROM forestry_projects WHERE is_org_member_current(org_id)))
  WITH CHECK (project_id IN (SELECT id FROM forestry_projects WHERE is_org_member_current(org_id)));
