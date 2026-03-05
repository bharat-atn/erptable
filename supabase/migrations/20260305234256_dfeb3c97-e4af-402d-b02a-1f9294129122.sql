ALTER TABLE public.banks DROP CONSTRAINT banks_name_unique;
ALTER TABLE public.banks ADD CONSTRAINT banks_org_name_unique UNIQUE (org_id, name);