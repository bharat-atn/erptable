
## Goal
Make company “vaults” waterproof so actions in one company cannot affect another, and restore the sandbox company dataset.

## 1) Backend: make “current company” durable (not connection-local)
1. Add `profiles.current_org_id uuid null references organizations(id)` (+ index).
2. Update `public.set_org_context(_org_id uuid)` to:
   - Validate membership (as today)
   - Persist the active org by updating `profiles.current_org_id = _org_id` for `auth.uid()`
   - (Optional) also keep `set_config('app.current_org_id', ...)` for same-request convenience, but do not rely on it.
3. Add helper functions:
   - `public.get_current_org_id()` → returns `profiles.current_org_id` for `auth.uid()`
   - `public.is_org_active(_org_id uuid)` → `get_current_org_id() = _org_id` (NO super-admin bypass)
   - Keep `public.is_super_admin()` as-is

## 2) Backend: split RLS into “read” vs “write” so deletes can’t cross orgs
For each tenant table (at minimum: `employees`, `invitations`, `contracts`, `companies`, `contract_schedules`, and any other org-scoped data tables used by HR):
1. Replace “FOR ALL” policies (notably on `contracts`) with separate policies:
   - **SELECT policy**: allow super admins global read, and non-admins scoped read (member + active org)
   - **INSERT/UPDATE/DELETE policies**: require `is_org_active(org_id)` (no super-admin bypass) so writes only apply to the currently selected company
2. Ensure `WITH CHECK` for INSERT/UPDATE also requires `is_org_active(org_id)`.

## 3) Frontend: scope all HR queries/mutations by selected org (default safe)
1. Introduce a shared pattern:
   - `const { orgId } = useOrg()`
   - Add `.eq("org_id", orgId)` to all HR data queries and mutations
   - Add `orgId` into React Query keys (e.g. `["contracts", orgId]`)
   - Disable queries until `orgId` exists (`enabled: !!orgId`)
2. Apply this across files that currently query without org scoping, including:
   - `src/components/dashboard/OperationsView.tsx`
   - `src/components/dashboard/DashboardView.tsx`
   - `src/components/dashboard/InvitationsView.tsx`
   - `src/components/dashboard/ContractsView.tsx`
   - `src/components/dashboard/EmployeeRegisterView.tsx`
   - `src/components/dashboard/CreateInvitationDialog.tsx`
   - `src/components/dashboard/RecentInvitationsTable.tsx`
   - `src/components/dashboard/OnboardingStatusChart.tsx`
   - `src/components/dashboard/OnboardingActivityChart.tsx`
   - plus any other views found via code search that read/write `employees/invitations/contracts/companies`
3. Tighten delete cascades in UI to also include org scoping (defense-in-depth), e.g.:
   - when deleting employee-related rows, delete `invitations/contracts` with both `employee_id` AND `org_id = orgId`.

## 4) Super admin: keep global view, but make it explicit + safe
1. Add a **Super Admin toggle** in HR views: “All companies” (default OFF).
2. When OFF (default): UI is scoped to `orgId` (safe mode).
3. When ON:
   - Remove `.eq("org_id", orgId)` filters for reads
   - Add an “Organization” column to tables
   - Show a prominent warning banner
   - Disable bulk-delete actions (or require extra typed confirmation including the org name + “ALL COMPANIES MODE”)

## 5) Restore sandbox data (best effort via audit, then seed)
1. Create an admin-only backend function `restore-sandbox-from-audit` that:
   - Attempts to reconstruct minimal records from `audit_log` for the sandbox org (where possible)
   - Logs what it could/couldn’t restore (audit payloads may be incomplete by design)
2. Add an admin-only backend function `seed-sandbox-data` that:
   - Sets org context to the sandbox org
   - Creates a fresh dataset (employees + invitations + draft contracts; optionally companies/banks) using existing generators (dummy/AI test-data function)
3. Add a “Sandbox Tools” card (visible only to super admin when sandbox is selected) with:
   - “Reset sandbox (delete sandbox data only)”
   - “Restore from audit (best effort)”
   - “Seed new sandbox dataset”
   - Each action must show a destructive confirmation + progress UI.

## 6) Verification (must-pass)
1. Super admin, Production selected: delete a contract/invitation/employee → sandbox data unchanged.
2. Super admin, toggle “All companies” ON: verify reads show both orgs, but deletes are blocked or require extra confirmation and still only apply to active org.
3. Non-super-admin user: can only see/manage active org data; cannot read or mutate other org.
4. Switch orgs: data displayed changes immediately; no “same data in both orgs” effect.
5. Run “Seed sandbox dataset” and confirm HR views show sandbox-only records.

## Deliverables (files)
- DB migrations: add `profiles.current_org_id`, helper functions, updated RLS policies.
- Frontend updates: org-scoped queries + super-admin “All companies” toggle + safety UI.
- Backend functions: `restore-sandbox-from-audit`, `seed-sandbox-data` (admin-only).
