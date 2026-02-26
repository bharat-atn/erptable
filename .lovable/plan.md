

## Plan: Remove "User" (User Management) Column from Role Permission Matrix

### Analysis
The "User" column in the Role Permission Matrix corresponds to the **User Management** app (`id: "user-management"`). Since this app is exclusively for Super Admins and already has a lockout protection preventing removal, showing it in the matrix adds no value.

### Changes

**File: `src/components/dashboard/RolePermissionMatrix.tsx`**
- Filter out the `user-management` app from the apps list used to render the matrix columns
- This keeps the app fully functional in the App Launcher — it simply won't appear as a toggleable column in the permission matrix

**No database changes required.** The `role_app_access` rows for `user-management` remain intact.

### Impact
- The matrix will show 5 columns instead of 6: HR, Forestry Project, Payroll, Employee Hub, Time & Status Reporting
- User Management app continues to work normally for Super Admins
- The "Reset to Defaults" function still includes `user-management` entries

