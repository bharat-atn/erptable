

## Plan: Add Time Reporting Application

### What We Are Building
A new "Time Reporting" application card in the App Launcher for team leaders and managers to report working hours per project and object. It will be marked as "Coming Soon" and use a clock icon.

### Changes

| File | Change |
|---|---|
| `src/components/dashboard/AppLauncher.tsx` | Add a new entry to `defaultApps` with id `time-reporting`, name "Time Reporting", Clock icon, Coming Soon status, and `allowedRoles` for admin, org_admin, project_manager, team_leader. |
| `src/components/dashboard/RolePermissionMatrix.tsx` | Add `time-reporting` to `DEFAULT_ACCESS` with the same roles so the "Reset to Defaults" feature includes it. |
| `src/components/dashboard/TeaserDialog.tsx` | Add teaser content for the Time Reporting app so clicking "Coming Soon" shows a feature preview dialog. |
| **Database** | Insert rows into `role_app_access` for the new `time-reporting` app granting access to admin, org_admin, project_manager, and team_leader. |

### App Definition

```text
id:          time-reporting
name:        Time Reporting
description: Report and track working hours per project and object. 
             Manage daily time entries, approve timesheets, and 
             generate attendance summaries.
icon:        Clock
color:       Amber (index 6)
available:   false (Coming Soon)
allowedRoles: admin, org_admin, project_manager, team_leader
```

### Permission Matrix After Change

```text
                  HR    User   Forestry  Payroll  Employee  Time
                  Mgmt  Mgmt   Project   Mgmt     Hub      Report
Super Admin       ✓      ✓       ✓        ✓        ✓        ✓
Admin             ✓      -       ✓        ✓        ✓        ✓
HR Manager        ✓      -       -        -        ✓        -
Project Manager   -      -       ✓        -        ✓        ✓
Payroll Manager   -      -       -        ✓        ✓        -
Team Leader       -      -       -        -        ✓        ✓
Standard User     -      -       -        -        ✓        -
```

### Database Seed
Insert 4 rows into `role_app_access` using the data insert tool (not a migration, since this is data, not schema):
- `(admin, time-reporting)`
- `(org_admin, time-reporting)`
- `(project_manager, time-reporting)`
- `(team_leader, time-reporting)`

