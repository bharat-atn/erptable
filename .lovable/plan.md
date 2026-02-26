

## Problem Analysis

**Root cause**: Ove Eriksson's role in `user_roles` is currently `org_admin` instead of `admin`. This happened during a previous role assignment operation. Since the RLS policies on the `profiles` table require `has_role(auth.uid(), 'admin')` to view all users, Ove can now only see his own profile. The `assign_user_role` function also requires `admin`, so he cannot fix this himself.

**Why users "disappeared"**: The SELECT policy on `profiles` only shows all users to accounts with the `admin` role. With `org_admin`, Ove falls back to the "Users can view own profile" policy, seeing only himself.

## Fix Plan

### 1. Database: Restore Ove's admin role
Update `user_roles` to change `org_admin` back to `admin` for Ove's user ID (`077d0153-5c56-40e5-8a3d-e887c8cb14e3`).

### 2. Code: Prevent self-demotion in `UserManagementView.tsx`
Add a guard in the `assignRoleMutation` to block any admin from changing their own role. This prevents the scenario that caused this lockout. The "Assign Role" dropdown will be disabled for the currently logged-in user with a tooltip explaining why.

### 3. Database function: Add self-assignment protection in `assign_user_role`
Add a server-side check in the `assign_user_role` function so that even if the client-side guard is bypassed, the function will refuse to let an admin demote themselves:

```text
IF _target_user_id = auth.uid() THEN
  RAISE EXCEPTION 'Cannot change your own role';
END IF;
```

This is a defense-in-depth measure ensuring the lockout scenario cannot recur.

### Summary of changes
- **Database data fix**: Restore `admin` role for Ove
- **Database function update**: Add self-assignment block in `assign_user_role`
- **Frontend**: Disable "Assign Role" dropdown for the current user's own row

