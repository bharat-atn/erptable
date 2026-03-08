
-- Create employee_deductions table for payroll-accessible deduction data
CREATE TABLE public.employee_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  deduction_type text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'monthly',
  note text,
  is_active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'contract',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;

-- HR can manage deductions
CREATE POLICY "HR staff can view employee_deductions"
  ON public.employee_deductions FOR SELECT
  TO authenticated
  USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can insert employee_deductions"
  ON public.employee_deductions FOR INSERT
  TO authenticated
  WITH CHECK (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can update employee_deductions"
  ON public.employee_deductions FOR UPDATE
  TO authenticated
  USING (is_hr_user() AND is_org_member_current(org_id));

CREATE POLICY "HR staff can delete employee_deductions"
  ON public.employee_deductions FOR DELETE
  TO authenticated
  USING (is_hr_user() AND is_org_member_current(org_id));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_employee_deductions_updated_at
  BEFORE UPDATE ON public.employee_deductions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to extract deductions from contract form_data when signed
CREATE OR REPLACE FUNCTION public.sync_contract_deductions()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _deduction jsonb;
BEGIN
  -- Only trigger when contract becomes fully signed
  IF NEW.signing_status = 'employer_signed' 
     AND OLD.signing_status IS DISTINCT FROM 'employer_signed' 
     AND NEW.form_data IS NOT NULL
     AND NEW.form_data->'salaryDeductions' IS NOT NULL THEN

    -- Deactivate any existing deductions from previous contracts for this employee
    UPDATE public.employee_deductions
    SET is_active = false, updated_at = now()
    WHERE employee_id = NEW.employee_id
      AND source = 'contract'
      AND is_active = true;

    -- Insert deductions from the signed contract
    FOR _deduction IN SELECT jsonb_array_elements(NEW.form_data->'salaryDeductions')
    LOOP
      INSERT INTO public.employee_deductions (
        employee_id, contract_id, org_id, deduction_type, amount, frequency, note, source
      ) VALUES (
        NEW.employee_id,
        NEW.id,
        NEW.org_id,
        COALESCE(_deduction->>'type', 'other'),
        COALESCE((_deduction->>'amount')::numeric, 0),
        COALESCE(_deduction->>'frequency', 'monthly'),
        _deduction->>'note',
        'contract'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to contracts table
CREATE TRIGGER sync_deductions_on_contract_signed
  AFTER UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION sync_contract_deductions();

-- Audit trigger
CREATE TRIGGER audit_employee_deductions
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_deductions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
