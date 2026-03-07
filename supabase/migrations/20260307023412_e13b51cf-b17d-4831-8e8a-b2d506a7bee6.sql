
-- Add ISO date validation to submit_employee_signature
CREATE OR REPLACE FUNCTION public.submit_employee_signature(_token text, _signature_url text, _signing_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _contract_id uuid;
  _date_val text;
BEGIN
  IF _token IS NULL OR length(_token) < 10 THEN
    RAISE EXCEPTION 'Invalid signing token';
  END IF;

  -- Validate ISO date in metadata
  _date_val := _signing_metadata->>'date';
  IF _date_val IS NOT NULL AND _date_val !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Signing date must follow ISO 8601 format (YYYY-MM-DD)';
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
      employee_signing_metadata = _signing_metadata,
      updated_at = now()
  WHERE id = _contract_id;
END;
$function$;

-- Add ISO date validation to submit_employer_signature
CREATE OR REPLACE FUNCTION public.submit_employer_signature(_contract_id uuid, _signature_url text, _signing_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _date_val text;
BEGIN
  IF NOT is_hr_user() THEN
    RAISE EXCEPTION 'Unauthorized: only HR staff can sign as employer';
  END IF;

  -- Validate ISO date in metadata
  _date_val := _signing_metadata->>'date';
  IF _date_val IS NOT NULL AND _date_val !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Signing date must follow ISO 8601 format (YYYY-MM-DD)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM contracts
    WHERE id = _contract_id
      AND signing_status = 'employee_signed'
  ) THEN
    RAISE EXCEPTION 'Contract not found or not awaiting employer signature';
  END IF;

  UPDATE contracts
  SET employer_signature_url = _signature_url,
      employer_signed_at = now(),
      signing_status = 'employer_signed',
      signed_at = now(),
      status = 'signed',
      employer_signing_metadata = _signing_metadata,
      updated_at = now()
  WHERE id = _contract_id;
END;
$function$;
