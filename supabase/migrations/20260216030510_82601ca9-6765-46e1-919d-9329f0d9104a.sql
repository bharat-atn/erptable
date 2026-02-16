
-- RPC for employer to counter-sign a contract
CREATE OR REPLACE FUNCTION public.submit_employer_signature(_contract_id uuid, _signature_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only HR users can sign as employer
  IF NOT is_hr_user() THEN
    RAISE EXCEPTION 'Unauthorized: only HR staff can sign as employer';
  END IF;

  -- Verify the contract exists and is awaiting employer signature
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
      updated_at = now()
  WHERE id = _contract_id;
END;
$function$;
