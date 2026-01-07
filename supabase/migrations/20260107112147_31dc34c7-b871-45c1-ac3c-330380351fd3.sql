-- Add middle_name column to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS middle_name TEXT;