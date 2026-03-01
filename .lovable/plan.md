

## Diagnosis

The login profile dialog is not appearing because the code relies on catching the `SIGNED_IN` event from `onAuthStateChange` to set `isNewLogin = true`. With Google OAuth (your login method), the page does a full redirect to Google and back. On that fresh page load, supabase-js v2.90+ emits `INITIAL_SESSION` as its first event. The `SIGNED_IN` event may not fire reliably in all cases (e.g., if the session was already persisted in browser storage), so `isNewLogin` stays `false` and the profile check effect at line 92 never executes.

## Fix

Replace the fragile `isNewLogin` / `SIGNED_IN` event detection with a `sessionStorage` flag approach:

**File: `src/pages/Index.tsx`**

1. Remove the `isNewLogin` state variable entirely.
2. When the profile dialog check runs (after session + role + orgId are resolved and `profileChecked` is false), query `profiles.skip_login_profile`. If `false`, show the dialog. Mark `profileChecked = true` regardless.
3. After the dialog is dismissed (via "Continue"), set a `sessionStorage` key (`profile_dialog_shown`) so it won't re-appear if the user navigates away and back within the same browser tab session.
4. On mount, if `sessionStorage.getItem("profile_dialog_shown")` exists, set `profileChecked = true` immediately to skip the check.
5. On sign-out (when session becomes null), remove the sessionStorage key so the next login triggers the dialog again.

This ensures:
- Every fresh login shows the dialog (unless `skip_login_profile` is true in the database).
- Navigating within the app or refreshing the page within the same tab session does not re-show it.
- Logging out and back in shows it again.

### Files to change
- `src/pages/Index.tsx` — Replace `isNewLogin`-based logic with `sessionStorage`-based logic.

