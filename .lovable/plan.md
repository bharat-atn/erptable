

## Plan: Fix Missing Profile for Existing Auth Users on Invite

### Problem
When inviting `yash@algoware.in`, the edge function found the user in `auth.users` and assigned the role successfully. However, the **profile row doesn't exist** — the function uses `.update()` on `profiles`, which silently affects 0 rows when there's no matching record. As a result, the user never appears in the User Management table (which reads from `profiles`).

### Root Cause
The `invite-user` edge function (existing-user branch, ~line 222) does:
```typescript
await adminClient.from("profiles").update({...}).eq("user_id", userId);
```
If the user has no profile (e.g., created externally or trigger didn't fire), this is a no-op.

### Fix

**`supabase/functions/invite-user/index.ts`**

Change the profile `.update()` to `.upsert()` in **both** the existing-user branch (~line 222) and the new-user-with-password branch (~line 282):

```typescript
// Before (both branches):
await adminClient.from("profiles")
  .update({ role: "approved", full_name: full_name || email, email })
  .eq("user_id", userId);

// After (both branches):
await adminClient.from("profiles")
  .upsert({
    user_id: userId,
    role: "approved",
    full_name: full_name || email,
    email,
  }, { onConflict: "user_id" });
```

This ensures a profile row is **created** if missing, or **updated** if it already exists.

### Immediate Data Fix
The existing user `yash@algoware.in` (id: `6b9d347d-...`) already has the `admin` role assigned but no profile. After deploying the fix, re-inviting or a one-time data patch will create the missing profile row.

### Result
- Inviting existing auth users who lack a profile will now correctly create the profile
- The user will immediately appear in the User Management table after invitation
- No more silent failures from `.update()` on non-existent rows

