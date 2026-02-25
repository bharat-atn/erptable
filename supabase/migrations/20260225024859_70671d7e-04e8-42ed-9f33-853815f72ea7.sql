
CREATE OR REPLACE FUNCTION public.activate_employee_on_contract_signed()
RETURNS trigger AS $$
BEGIN
  IF NEW.signing_status = 'employer_signed' 
     AND OLD.signing_status IS DISTINCT FROM 'employer_signed' THEN
    UPDATE public.employees
    SET status = 'ACTIVE', updated_at = now()
    WHERE id = NEW.employee_id
      AND status = 'ONBOARDING';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trg_activate_employee_on_contract_signed
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.activate_employee_on_contract_signed();
