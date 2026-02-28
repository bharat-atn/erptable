
-- Fix: drop the unique constraint properly, then add composite one
ALTER TABLE public.contract_id_year_counters DROP CONSTRAINT IF EXISTS contract_id_year_counters_year_key;
ALTER TABLE public.contract_id_year_counters ADD CONSTRAINT uq_contract_id_year_counters_org_year UNIQUE (org_id, year);
