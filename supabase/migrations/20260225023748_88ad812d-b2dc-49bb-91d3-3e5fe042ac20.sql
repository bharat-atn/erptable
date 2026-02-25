
CREATE OR REPLACE FUNCTION public.cleanup_invited_employee_on_invitation_delete()
RETURNS trigger AS $$
BEGIN
  -- Only act if the deleted invitation had an employee_id
  IF OLD.employee_id IS NOT NULL THEN
    -- Check if the employee is still in INVITED status
    -- and has no other invitations remaining
    IF EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = OLD.employee_id
        AND status = 'INVITED'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.invitations
      WHERE employee_id = OLD.employee_id
        AND id != OLD.id
    ) THEN
      DELETE FROM public.employees WHERE id = OLD.employee_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_cleanup_invited_employee
  AFTER DELETE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_invited_employee_on_invitation_delete();
