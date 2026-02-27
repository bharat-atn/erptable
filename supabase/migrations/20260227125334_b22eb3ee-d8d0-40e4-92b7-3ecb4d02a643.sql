
CREATE TABLE public.app_launcher_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apps jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_launcher_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR staff can view app_launcher_config" ON public.app_launcher_config
  FOR SELECT USING (is_hr_user());

CREATE POLICY "HR staff can insert app_launcher_config" ON public.app_launcher_config
  FOR INSERT WITH CHECK (is_hr_user());

CREATE POLICY "HR staff can update app_launcher_config" ON public.app_launcher_config
  FOR UPDATE USING (is_hr_user());
