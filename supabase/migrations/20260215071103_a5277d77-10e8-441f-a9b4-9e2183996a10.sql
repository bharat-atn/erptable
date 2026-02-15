-- Add key stored fields to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS bankgiro text,
  ADD COLUMN IF NOT EXISTS ceo_name text,
  ADD COLUMN IF NOT EXISTS company_type text;

-- Add comment for clarity
COMMENT ON COLUMN public.companies.bankgiro IS 'Company bankgiro number';
COMMENT ON COLUMN public.companies.ceo_name IS 'CEO / VD name';
COMMENT ON COLUMN public.companies.company_type IS 'e.g. Aktiebolag (AB), Handelsbolag (HB)';