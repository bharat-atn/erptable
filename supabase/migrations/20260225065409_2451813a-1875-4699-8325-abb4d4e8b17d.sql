
-- Update the cleanup trigger to also handle ONBOARDING employees
-- when their last invitation is deleted AND they have no contracts
CREATE OR REPLACE FUNCTION public.cleanup_invited_employee_on_invitation_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.employee_id IS NOT NULL THEN
    -- Clean up INVITED employees (existing logic)
    -- OR ONBOARDING employees with no remaining invitations and no contracts
    IF EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = OLD.employee_id
        AND status IN ('INVITED', 'ONBOARDING')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.invitations
      WHERE employee_id = OLD.employee_id
        AND id != OLD.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.contracts
      WHERE employee_id = OLD.employee_id
    ) THEN
      DELETE FROM public.employees WHERE id = OLD.employee_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$function$;

-- Add a trigger to clean up ONBOARDING employees when their last contract is deleted
-- and they have no remaining invitations
CREATE OR REPLACE FUNCTION public.cleanup_employee_on_contract_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.employee_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = OLD.employee_id
        AND status IN ('INVITED', 'ONBOARDING')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.contracts
      WHERE employee_id = OLD.employee_id
        AND id != OLD.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.invitations
      WHERE employee_id = OLD.employee_id
    ) THEN
      DELETE FROM public.employees WHERE id = OLD.employee_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$function$;

-- Create the trigger on contracts table
DROP TRIGGER IF EXISTS trg_cleanup_employee_on_contract_delete ON public.contracts;
CREATE TRIGGER trg_cleanup_employee_on_contract_delete
  AFTER DELETE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_employee_on_contract_delete();
