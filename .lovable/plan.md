

## Summary

The User Management app is already restricted to Super Admins via `adminOnly: true` and `allowedRoles: ["admin"]` in the App Launcher. The existing "Organizations" column and "Manage Orgs" dialog already allow Super Admins to assign users to specific organizations. However, the current UI could be more prominent about this being the primary access control mechanism.

The key insight: **org_members** is the gate that controls which organizations appear in a user's Organization Picker. If a user is not a member of an org, they cannot select it (enforced by RLS on the `organizations` table: `is_org_member(id)`). This is already working correctly.

### What's Already In Place (No Changes Needed)
- User Management visible only to Super Admin (`adminOnly: true`)
- RLS on `organizations` filters by `is_org_member(id)` for non-admins
- ManageOrgsDialog lets Super Admin add/remove users from organizations

### Improvements to Make

**1. Make the Organizations column more informative** (`UserManagementView.tsx`)
- Show the actual organization names (not just "Prod"/"Sandbox" badges)
- Show org name + type badge so it's immediately clear which companies a user has access to
- Make "No organizations" state more prominent with a warning indicator

**2. Add organization assignment to the Invite User dialog** (`UserManagementView.tsx`)
- When inviting a new user, allow the Super Admin to pre-select which organizations the user should be added to
- After the user signs up and the pending role is assigned, automatically create `org_members` entries

**3. Add organization filter to the users table** (`UserManagementView.tsx`)
- Add a filter chip for "Organization" so Super Admins can quickly see which users belong to which company

### Files Changed
1. **`src/components/dashboard/UserManagementView.tsx`** — Enhance Organizations column display, add org selection to invite dialog, add org filter

