
-- Add email and last_sign_in_at to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

-- Create user_app_access table for per-user app access control
CREATE TABLE public.user_app_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_id)
);

-- Enable RLS
ALTER TABLE public.user_app_access ENABLE ROW LEVEL SECURITY;

-- Admins can manage all access records
CREATE POLICY "Admins can manage app access"
  ON public.user_app_access
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own access
CREATE POLICY "Users can view own app access"
  ON public.user_app_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Update handle_new_user trigger to store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'pending'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;
