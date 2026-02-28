ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';