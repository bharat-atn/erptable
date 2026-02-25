
-- Create app_versions table
CREATE TABLE public.app_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_tag text NOT NULL,
  release_type text NOT NULL DEFAULT 'alpha',
  release_date date NOT NULL DEFAULT CURRENT_DATE,
  release_time_utc timestamptz NOT NULL DEFAULT now(),
  sequence_number integer NOT NULL,
  status text NOT NULL DEFAULT 'published',
  notes text NOT NULL DEFAULT '',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- RLS: HR users can read
CREATE POLICY "HR staff can view app_versions"
  ON public.app_versions FOR SELECT
  USING (is_hr_user());

-- RLS: HR users can insert
CREATE POLICY "HR staff can insert app_versions"
  ON public.app_versions FOR INSERT
  WITH CHECK (is_hr_user());

-- RLS: HR users can update
CREATE POLICY "HR staff can update app_versions"
  ON public.app_versions FOR UPDATE
  USING (is_hr_user());

-- Add unique constraint on version_tag
ALTER TABLE public.app_versions ADD CONSTRAINT app_versions_version_tag_unique UNIQUE (version_tag);

-- Add unique constraint on date + sequence
ALTER TABLE public.app_versions ADD CONSTRAINT app_versions_date_seq_unique UNIQUE (release_date, sequence_number);
