-- Allow HR staff to delete employees
CREATE POLICY "HR staff can delete employees"
ON public.employees
FOR DELETE
USING (is_hr_user());

-- Allow cascading delete for contracts when employee is deleted
ALTER TABLE public.contracts
DROP CONSTRAINT IF EXISTS contracts_employee_id_fkey;

ALTER TABLE public.contracts
ADD CONSTRAINT contracts_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES public.employees(id)
ON DELETE CASCADE;

-- Allow cascading delete for invitations when employee is deleted
ALTER TABLE public.invitations
DROP CONSTRAINT IF EXISTS invitations_employee_id_fkey;

ALTER TABLE public.invitations
ADD CONSTRAINT invitations_employee_id_fkey
FOREIGN KEY (employee_id) REFERENCES public.employees(id)
ON DELETE CASCADE;