

## Plan: Expand Role System to 7 Roles

### Current State
The database has an `app_role` enum with 4 values: `admin`, `hr_admin`, `hr_staff`, `user`. These are referenced across the database (functions, RLS policies), edge functions, and multiple frontend components.

### New Role Structure

| # | Display Name | Enum Value | Replaces |
|---|---|---|---|
| 1 | Super Admin | `admin` | (unchanged) |
| 2 | Admin | `org_admin` | (new) |
| 3 | Standard User | `user` | (unchanged) |
| 4 | Team Leader | `team_leader` | (new) |
| 5 | HR Manager | `hr_manager` | replaces `hr_admin` |
| 6 | Project Manager | `project_manager` | (new) |
| 7 | Payroll Manager | `payroll_manager` | (new) |

Old values `hr_admin` and `hr_staff` will be migrated: `hr_admin` → `hr_manager`, `hr_staff` → `user`.

### Database Migration

1. **Add new enum values** to `app_role`: `org_admin`, `team_leader`, `hr_manager`, `project_manager`, `payroll_manager`
2. **Migrate existing data**: Update `user_roles` rows with `hr_admin` → `hr_manager` and `hr_staff` → `user`
3. **Remove old values**: Recreate the enum without `hr_admin` and `hr_staff` (requires column type swap since Postgres cannot drop enum values directly)
4. **Update `is_hr_user()` function**: Change the role check to include the new management roles (`admin`, `org_admin`, `hr_manager`) instead of the old ones
5. **Update `handle_new_user()` and other functions**: No changes needed (they don't reference specific non-admin roles)

### Frontend Changes

| File | Change |
|---|---|
| `src/components/dashboard/UserManagementView.tsx` | Update `ROLE_OPTIONS` array to 7 roles with new labels. Update `roleBadge()` with icons for each role. Update filter options. |
| `src/hooks/useUserRole.ts` | Update priority array to new 7-role order. Update `isHR` check to use new role names. |
| `src/components/dashboard/AppLauncher.tsx` | Update `allowedRoles` arrays in `defaultApps` to reference new role values. Update type annotations. |
| `src/components/dashboard/Sidebar.tsx` | Update `userRole` type annotation to include all 7 roles. |
| `src/components/dashboard/Dashboard.tsx` | Type will auto-update from the enum. |
| `supabase/functions/send-role-notification/index.ts` | Update `ROLE_LABELS` map with all 7 roles. |
| `supabase/functions/invite-user/index.ts` | No logic changes needed (role is passed through). |

### Role Icon Mapping (for `roleBadge`)

```text
admin          → Shield         Super Admin
org_admin      → ShieldCheck    Admin
hr_manager     → UserCheck      HR Manager
project_manager→ Briefcase      Project Manager
payroll_manager→ Wallet         Payroll Manager
team_leader    → Users          Team Leader
user           → User           Standard User
```

### Access Control Updates

The `is_hr_user()` database function currently checks for `hr_staff`, `hr_admin`, `admin`. It will be updated to check for `admin`, `org_admin`, `hr_manager` — these are the roles that can manage employees, contracts, and invitations.

The `useUserRole` hook's `isHR` flag will match the same set.

App visibility will be reconfigured in the next step (as the user mentioned), so for now `allowedRoles` will be broadened to include all new roles where appropriate.

