

## Plan: Add Employee Code/ID Field to Data Handling Column Mapping

### Problem
The Data Handling CSV import has no "Employee Code" or "Employee ID" option in the system field mapping dropdown. The CSV file contains columns like `[Anställd]Id` and `PersonNr` that should be mappable to the `employee_code` column on the `employees` table.

### Changes (single file: `src/components/dashboard/DataHandlingView.tsx`)

**1. Add `employee_code` to `SYSTEM_FIELDS` array (~line 52)**
- Add `{ key: "employee_code", label: "Employee ID / Anställnings-ID", group: "core" }` to the field list, placed after the name fields and before email.

**2. Add aliases to `HEADER_ALIASES` (~line 75)**
- Map common Swedish/English CSV headers to `employee_code`:
  - `personnr`, `personnummer`, `personnr` → `employee_code`
  - `anstallid`, `anställdid`, `employeeid`, `employee_id`, `employee_code`, `empid`, `emp_id` → `employee_code`

**3. Ensure `employee_code` is carried through the mapping pipeline**
- The `MappedEmployee` interface already has `employee_code` (line 36), so no interface change needed.
- Verify the `proceedToWashing` callback maps the field correctly to `employee_code` on each row (it likely already handles any key in `SYSTEM_FIELDS` that matches a top-level `MappedEmployee` property).

This is a small, targeted change — roughly 5 lines added.

