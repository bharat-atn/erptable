
-- 1. Delete the current orphaned employee
DELETE FROM public.employees 
WHERE id = '59e92f3a-dc54-4588-a386-dcfc8d1fdff0'
  AND NOT EXISTS (SELECT 1 FROM public.invitations WHERE employee_id = '59e92f3a-dc54-4588-a386-dcfc8d1fdff0')
  AND NOT EXISTS (SELECT 1 FROM public.contracts WHERE employee_id = '59e92f3a-dc54-4588-a386-dcfc8d1fdff0');

-- 2. Also clean up any other orphans that might exist
DELETE FROM public.employees e
WHERE e.status IN ('INVITED', 'ONBOARDING')
  AND NOT EXISTS (SELECT 1 FROM public.invitations i WHERE i.employee_id = e.id)
  AND NOT EXISTS (SELECT 1 FROM public.contracts c WHERE c.employee_id = e.id);

-- 3. Improve contract-delete trigger to use advisory lock for race conditions
CREATE OR REPLACE FUNCTION public.cleanup_employee_on_contract_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.employee_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('cleanup_emp_' || OLD.employee_id::text));
    
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
$$;

-- 4. Improve invitation-delete trigger similarly
CREATE OR REPLACE FUNCTION public.cleanup_invited_employee_on_invitation_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.employee_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('cleanup_emp_' || OLD.employee_id::text));
    
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
$$;
