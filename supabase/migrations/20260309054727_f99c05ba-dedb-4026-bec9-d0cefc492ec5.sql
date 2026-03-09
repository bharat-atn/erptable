
-- Table for persisting clock in/out entries
CREATE TABLE public.time_clock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.forestry_projects(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('clock_in', 'clock_out')),
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  latitude numeric,
  longitude numeric,
  inside_geofence boolean,
  selfie_url text,
  environment_photo_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.time_clock_entries ENABLE ROW LEVEL SECURITY;

-- HR can see all entries in their org
CREATE POLICY "HR can manage time_clock_entries"
  ON public.time_clock_entries
  FOR ALL
  USING (is_hr_user() AND is_org_member_current(org_id))
  WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

-- Org members can view entries for their org (team leaders, etc.)
CREATE POLICY "Org members can view time_clock_entries"
  ON public.time_clock_entries
  FOR SELECT
  USING (is_org_member_current(org_id));

-- Org members can insert (employees clocking in via hub)
CREATE POLICY "Org members can insert time_clock_entries"
  ON public.time_clock_entries
  FOR INSERT
  WITH CHECK (is_org_member_current(org_id));

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_clock_entries;

-- Create storage bucket for clock photos
INSERT INTO storage.buckets (id, name, public) VALUES ('clock-photos', 'clock-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload clock photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clock-photos' AND auth.role() = 'authenticated');

-- Storage policy: anyone can read (public bucket)
CREATE POLICY "Public read clock photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clock-photos');
