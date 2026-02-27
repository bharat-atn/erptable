

## Problem

Dorin was invited using the **old** `invite-user` code, which pre-created an auth user for `dorinlazea@gmail.com` with an **email identity** (user_id `e4f82c48...`). This auth user has role `org_admin` and status `approved` -- but Dorin has **never signed in** (`last_sign_in_at: null`).

When Dorin tries to sign in with **Google OAuth** using the same Gmail address, Supabase sees the email is already taken by an email-provider account and either rejects the sign-in or creates a second auth user with no roles. Either way, he can't get in.

The new `pending_role_assignments` system prevents this for **future** invitations, but the old pre-created auth user still blocks Dorin.

## Solution

Two parts: (A) fix Dorin's specific case now, and (B) add a safety net so any user who signs in and has a pending assignment gets auto-approved, even if the `handle_new_user` trigger didn't fire (e.g., because an old auth user already existed).

### 1. Create a cleanup edge function

Create a new `cleanup-orphan-user` edge function that an admin can invoke. It will:
- Accept an email address
- Use `admin.auth.admin.listUsers()` to find the pre-created auth user
- Delete the auth user via `admin.auth.admin.deleteUser()`
- Insert a `pending_role_assignment` row with the user's existing role and app_access (preserved from the old data before deletion)
- This way, when Dorin signs in fresh via Google, the `handle_new_user` trigger fires and auto-assigns his role

### 2. Add client-side pending role check on sign-in

Modify `Index.tsx` so that when a user has a session but **no role**, it calls a new edge function `check-pending-role` that:
- Reads the authenticated user's email
- Checks `pending_role_assignments` for a match
- If found, assigns the role, updates profile, copies app access, and deletes the pending row
- Returns the assigned role

This acts as a safety net for cases where the database trigger didn't fire (e.g., identity linking instead of new user creation).

### 3. Clean up Dorin's data

After deploying, the admin calls the cleanup function for `dorinlazea@gmail.com`. The pre-created auth user is deleted, a pending assignment is created with role `org_admin` and his 5 app_access entries. Dorin signs in via Google, gets auto-approved.

Also clean up the other orphan: `dorin.lazea@ljunganforestry.se` (user_id `f2e38b2c...`, role `pending`, never signed in) -- this can simply be deleted as it's a separate work email that won't be used.

## Implementation Steps

1. **New edge function `check-pending-role`** -- authenticated users call this; it checks `pending_role_assignments` by email and auto-assigns if found. Add `verify_jwt = false` in config.toml but validate auth header in code.

2. **New edge function `cleanup-orphan-user`** -- admin-only; accepts email, preserves role + app_access into `pending_role_assignments`, then deletes the orphaned auth user.

3. **Update `Index.tsx`** -- when `role` is null after loading, call `check-pending-role` before showing `PendingApproval`. If a role is returned, trigger a re-fetch.

4. **Update `UserManagementView.tsx`** -- add a "Clean up orphan" action or call the cleanup function automatically for users with `last_sign_in_at: null` who were pre-created by the old system.

