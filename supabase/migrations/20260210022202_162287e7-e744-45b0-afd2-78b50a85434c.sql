
-- Add new columns to employees table for Operations view
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS employee_code text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text;

-- Create a function to auto-generate employee codes
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM 5) AS integer)), 0) + 1
  INTO next_num
  FROM public.employees
  WHERE employee_code IS NOT NULL AND employee_code ~ '^EPM-\d+$';
  
  NEW.employee_code := 'EPM-' || LPAD(next_num::text, 3, '0');
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating employee codes on insert
CREATE TRIGGER set_employee_code
BEFORE INSERT ON public.employees
FOR EACH ROW
WHEN (NEW.employee_code IS NULL)
EXECUTE FUNCTION public.generate_employee_code();
