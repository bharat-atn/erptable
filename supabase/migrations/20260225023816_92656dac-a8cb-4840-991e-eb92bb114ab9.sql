
CREATE OR REPLACE FUNCTION public.cleanup_invited_employee_on_invitation_delete()
RETURNS trigger AS $$
BEGIN
  IF OLD.employee_id IS NOT NULL THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
