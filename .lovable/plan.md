

## Plan: Translate All Page View Titles and Descriptions

### Scope
Add i18n translations to the following page views, covering their **headings, descriptions, button labels, table headers, filter labels, and status labels**:

1. **DashboardView** — "Dashboard", "Overview of onboarding metrics and activities", stat labels, button text
2. **OperationsView** — "Operations", "Manage workflows and employee lifecycle", status filter labels, table headers
3. **InvitationsView** — "Invitations", "Manage employee onboarding invitations", table headers, action buttons
4. **ContractsView** — "Contracts", table headers, status labels, action buttons
5. **EmployeeRegisterView** — "Employee Register", description, table headers, action buttons
6. **ProcessGuideView** — "Process Guide", description, terminology titles, workflow step labels, role labels
7. **EmployeesView** — "Employees", description, table headers
8. **CompanyRegisterView** — "Company Register", table headers
9. **BankListView** — "Bank Information", table headers
10. **AuditLogView** — "Audit Log", description, filter labels
11. **VersionManagementView** — "Version Management", description, table headers
12. **UserManagementView** — "Users", description, table headers

### Changes

#### 1. `src/lib/ui-translations.ts`
Add ~100-150 new translation keys covering:
- Page titles and subtitles (e.g., `"page.dashboard.title"`, `"page.dashboard.desc"`)
- Common table headers (`"table.email"`, `"table.status"`, `"table.name"`, `"table.date"`)
- Common action buttons (`"action.add"`, `"action.edit"`, `"action.delete"`, `"action.search"`, `"action.export"`, `"action.import"`)
- Status labels (`"status.active"`, `"status.inactive"`, `"status.invited"`, `"status.onboarding"`)
- Page-specific strings where needed

#### 2. Each View Component (12 files)
For each view file:
- Import `useUiLanguage` hook
- Replace hardcoded English strings with `t("key")` calls
- Pass `t` function down to sub-components where needed

The pattern in each file will be:
```typescript
import { useUiLanguage } from "@/hooks/useUiLanguage";
// ...
const { t } = useUiLanguage();
// ...
<h1>{t("page.operations.title")}</h1>
<p>{t("page.operations.desc")}</p>
```

### Files to modify
- `src/lib/ui-translations.ts` — Add all new translation keys (EN, SV, RO)
- `src/components/dashboard/DashboardView.tsx`
- `src/components/dashboard/OperationsView.tsx`
- `src/components/dashboard/InvitationsView.tsx`
- `src/components/dashboard/ContractsView.tsx`
- `src/components/dashboard/EmployeeRegisterView.tsx`
- `src/components/dashboard/EmployeesView.tsx`
- `src/components/dashboard/ProcessGuideView.tsx`
- `src/components/dashboard/CompanyRegisterView.tsx`
- `src/components/dashboard/BankListView.tsx`
- `src/components/dashboard/AuditLogView.tsx`
- `src/components/dashboard/VersionManagementView.tsx`
- `src/components/dashboard/UserManagementView.tsx`

