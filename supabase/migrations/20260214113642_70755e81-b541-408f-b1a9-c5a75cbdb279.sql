
-- Add signing fields to contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS signing_status text NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS signing_token text,
  ADD COLUMN IF NOT EXISTS employee_signature_url text,
  ADD COLUMN IF NOT EXISTS employer_signature_url text,
  ADD COLUMN IF NOT EXISTS employee_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS employer_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_for_signing_at timestamptz;

-- Create index on signing_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_contracts_signing_token ON public.contracts (signing_token) WHERE signing_token IS NOT NULL;

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: HR can manage signatures
CREATE POLICY "HR staff can upload signatures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures' AND (SELECT is_hr_user()));

CREATE POLICY "HR staff can view signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures' AND (SELECT is_hr_user()));

-- Allow public upload to signatures bucket (for employee signing via token)
CREATE POLICY "Anyone can upload to signatures with valid path"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signatures');

-- Allow public read of signatures (needed for display)
CREATE POLICY "Anyone can read signatures"
ON storage.objects FOR SELECT
USING (bucket_id = 'signatures');

-- Create RPC function to get contract by signing token (for public signing page)
CREATE OR REPLACE FUNCTION public.get_contract_for_signing(_token text)
RETURNS TABLE(
  contract_id uuid,
  contract_code text,
  company_name text,
  employee_first_name text,
  employee_last_name text,
  signing_status text,
  employee_signed_at timestamptz,
  employer_signed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid signing token';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    c.contract_code,
    co.name,
    e.first_name,
    e.last_name,
    c.signing_status,
    c.employee_signed_at,
    c.employer_signed_at
  FROM contracts c
  JOIN employees e ON c.employee_id = e.id
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE c.signing_token = _token
  LIMIT 1;
END;
$$;

-- Create RPC function to submit employee signature
CREATE OR REPLACE FUNCTION public.submit_employee_signature(_token text, _signature_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _contract_id uuid;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid signing token';
  END IF;

  SELECT id INTO _contract_id
  FROM contracts
  WHERE signing_token = _token
    AND signing_status = 'sent_to_employee';

  IF _contract_id IS NULL THEN
    RAISE EXCEPTION 'Contract not found or not awaiting employee signature';
  END IF;

  UPDATE contracts
  SET employee_signature_url = _signature_url,
      employee_signed_at = now(),
      signing_status = 'employee_signed',
      updated_at = now()
  WHERE id = _contract_id;
END;
$$;
