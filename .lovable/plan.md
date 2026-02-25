

## Plan: Clean Employee Lifecycle — Separate Candidates from Employees

### Problem
Currently, creating an invitation immediately creates an employee record (status: INVITED). This means candidates appear in the Employee Register before they've completed all onboarding steps. The user wants a clear separation: you are only an "employee" after the full process is complete.

### Desired Lifecycle
```text
Step 1: Invitation sent        → tracked in Invitations view only
Step 2: Form filled out         → status: ONBOARDING (still a candidate)
Step 3: Contract signed         → status: ONBOARDING (still a candidate)
Step 4: Employer counter-signs  → status: ACTIVE → Employee ID assigned → appears in Employee Register
```

### Changes

#### 1. Employee Register — Show Only Employed People
**Files:** `src/components/dashboard/EmployeeRegisterView.tsx`, `src/components/dashboard/EmployeesView.tsx`

- Filter the query to only fetch employees with status `ACTIVE` or `INACTIVE`
- Remove `INVITED` and `ONBOARDING` from the status filter options in the Employee Register
- Update the status config to only show "Active" and "Terminated"
- Update heading/description to clarify this is for employed staff only ("Registered employees who have completed all onboarding steps")

#### 2. Operations View — The Lifecycle Pipeline
**File:** `src/components/dashboard/OperationsView.tsx`

- Keep showing all statuses (INVITED, ONBOARDING, ACTIVE, INACTIVE) — this is the pipeline tracker
- Update description to clarify it tracks the full lifecycle from invitation through employment

#### 3. Automatic Status Transition on Contract Completion
**File:** Database migration

- Create a trigger on the `contracts` table: when `signing_status` changes to `employer_signed`, automatically update the linked employee's status from `ONBOARDING` to `ACTIVE`
- This ensures the employee only enters the register after the contract is fully signed
- The existing `generate_employee_code` trigger already fires when status becomes `ACTIVE`, so the Employee ID will be assigned automatically

#### 4. EmployeesView Alignment
**File:** `src/components/dashboard/EmployeesView.tsx`

- Apply the same `ACTIVE`/`INACTIVE` filter so this view also only shows registered employees

### Technical Details

**Database trigger (new):**
```sql
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
```

**Employee Register query change:**
```typescript
// Before:
.from("employees").select("*").order(...)
// After:
.from("employees").select("*").in("status", ["ACTIVE", "INACTIVE"]).order(...)
```

**No changes needed to:**
- Invitation creation flow (still creates employee records for internal tracking)
- Onboarding submission (still updates employee to ONBOARDING)
- Contract wizard (still references employee_id)
- The `generate_employee_code` trigger (already only fires on ACTIVE)

