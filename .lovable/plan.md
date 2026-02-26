

## Plan: Role-Permission Matrix for App Access Control

### Overview
Build a visual matrix table inside the User Management hub where each row is one of the 7 roles and each column is an application from the App Launcher. Each cell contains a toggle switch so an admin can quickly see and change which roles have access to which apps.

### Current State
- App access is hardcoded in `defaultApps` inside `AppLauncher.tsx` via the `allowedRoles` string array on each `AppDefinition`.
- The `loadApps()` function syncs `allowedRoles` from `defaultApps` into any saved (localStorage) apps, meaning local edits to `allowedRoles` are overwritten on reload.
- There is no database table storing role-to-app permissions; it is purely code-driven.

### Design

**New database table**: `role_app_access`

```text
┌──────────────────────────────────────────────────┐
│  role_app_access                                 │
├──────────────┬──────────────┬────────────────────┤
│  id (uuid)   │  role (text) │  app_id (text)     │
├──────────────┼──────────────┼────────────────────┤
│  PK, default │  NOT NULL    │  NOT NULL           │
│              │              │  unique(role,app_id)│
└──────────────┴──────────────┴────────────────────┘
```

The migration will seed this table with the current hardcoded defaults so nothing changes on day one.

**New component**: `RolePermissionMatrix` — rendered as a new sidebar item or a tab/section within User Management.

```text
Role Permission Matrix
─────────────────────────────────────────────────────────────
                 HR Mgmt   User Mgmt   Forestry   Payroll   Employee Hub
Super Admin      [✓]        [✓]         [✓]        [✓]       [✓]
Admin            [✓]        [ ]         [✓]        [✓]       [✓]
HR Manager       [✓]        [ ]         [ ]        [ ]       [✓]
Project Manager  [ ]        [ ]         [✓]        [ ]       [✓]
Payroll Manager  [ ]        [ ]         [ ]        [✓]       [✓]
Team Leader      [ ]        [ ]         [ ]        [ ]       [✓]
Standard User    [ ]        [ ]         [ ]        [ ]       [✓]
─────────────────────────────────────────────────────────────
```

Each toggle calls an insert or delete on `role_app_access`. The App Launcher will read from this table instead of the hardcoded `allowedRoles`.

### Database Migration

1. Create `role_app_access` table with columns `id`, `role`, `app_id`, and a unique constraint on `(role, app_id)`.
2. Enable RLS — only `admin` role can read/write.
3. Seed with the current defaults:
   - `hr-management`: admin, org_admin, hr_manager
   - `user-management`: admin
   - `forestry-project`: admin, org_admin, project_manager
   - `payroll`: admin, org_admin, payroll_manager
   - `employee-hub`: all 7 roles

### Frontend Changes

| File | Change |
|---|---|
| **New: `src/components/dashboard/RolePermissionMatrix.tsx`** | Matrix table component. Rows = 7 roles (ordered by hierarchy). Columns = all apps from `loadApps()`. Each cell is a `Switch` toggle. Fetches current state from `role_app_access`, inserts/deletes on toggle. Includes a "Reset to Defaults" button. |
| `src/components/dashboard/AppLauncher.tsx` | Remove hardcoded `allowedRoles` from `defaultApps`. Modify the visibility filter to query `role_app_access` (passed as a prop or fetched). The `loadApps` sync logic will stop overwriting `allowedRoles`. |
| `src/components/dashboard/UserManagementView.tsx` | Add a "Role Permissions" button/tab that opens the `RolePermissionMatrix` component, or integrate it as a collapsible section at the top of the view. |
| `src/components/dashboard/Sidebar.tsx` | Add a "Role Permissions" menu item under the User Management app sidebar, linked to a new view id (e.g., `role-permissions`). |
| `src/components/dashboard/Dashboard.tsx` | Add the `role-permissions` view case to render `RolePermissionMatrix`. |

### Component Details: RolePermissionMatrix

- Fetches all apps via `loadApps()` for column headers (using app name + icon).
- Fetches all rows from `role_app_access` on mount.
- Displays a clean table with role display names and icons on the left.
- Each cell is a `Switch` component.
- Toggling on → inserts a row into `role_app_access`.
- Toggling off → deletes the matching row.
- Uses `useMutation` with optimistic updates for snappy UX.
- Super Admin row for User Management is locked on (cannot be toggled off) to prevent lockout.
- Shows a toast on each change: "HR Manager can now access Payroll Management" / "Access removed".

### App Launcher Integration

The `AppLauncher` component will receive a `roleAppAccess` map (or fetch it internally) and use it instead of the static `allowedRoles` arrays. The flow:

1. On mount, query `role_app_access` for the current user's role.
2. Filter visible apps based on whether the user's role has a matching `app_id` entry.
3. Fall back to showing nothing (except apps with no restrictions) if the table is empty.

### Security

- RLS on `role_app_access`: SELECT for all authenticated users (they need to check their own access), INSERT/UPDATE/DELETE restricted to `admin` role via `has_role()`.
- The matrix UI itself is only accessible to Super Admin (enforced by sidebar visibility and the User Management app's existing access control).

