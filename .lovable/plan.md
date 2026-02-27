

## Investigation Results

I found **three distinct problems**:

### Problem 1: Invitation link logs in the wrong person on another device
The invitation email contains a link to `https://erptable.lovable.app` — which is just the homepage. It does not target the invited email address. When you opened it on your phone, Google OAuth used whatever Google account your phone browser had (your admin account `ove.eriksson@dahai.se`), not the invited account (`ove.ericxon@gmail.com`).

**Fix:** Pass `login_hint` to Google OAuth so it pre-selects the correct account. Also update the invitation email link to include the target email as a URL parameter, and read it in the AuthForm to pass to the OAuth flow.

### Problem 2: Sidebar shows all items while loading (flash of unfiltered content)
In `Sidebar.tsx` line 699: `if (!allowedItems) return items` — while the sidebar permissions query is loading, `allowedItems` is `undefined`, so **all** menu items are shown. This means every user briefly sees the full sidebar before permissions load.

**Fix:** Return an empty array instead of all items while loading. Show items only after permissions have been fetched.

### Problem 3: Invited user got access to User Management app
The `org_admin` user was given `user-management` in their `user_app_access` — visible in the audit log: `app_access: [hr-management, forestry-project, payroll, employee-hub, time-reporting, user-management]`. This happened because the Invite User dialog let the admin manually add `user-management` to the app access list. User Management should be locked to admin-only and not selectable in the invite dialog.

**Fix:** Filter out `user-management` from the app access checkboxes in the Invite User dialog (it's already hidden in the Role Permission Matrix). Also remove the incorrect `user-management` access from `ove.ericxon@gmail.com`.

---

### Implementation Steps

1. **Fix sidebar loading flash** — In `Sidebar.tsx`, change `if (!allowedItems) return items` to `if (!allowedItems) return []` so nothing shows while loading. Add a loading indicator or skeleton if needed.

2. **Lock User Management from invite dialog** — In `UserManagementView.tsx`'s `InviteUserDialog`, filter out the `user-management` app from the selectable apps list, matching the same protection used in the Role Permission Matrix.

3. **Add `login_hint` to invitation flow** — Update `invite-user` edge function to include `?login_hint=EMAIL` in the invitation link URL. Update `AuthForm.tsx` to read the `login_hint` query parameter and pass it to `signInWithOAuth` as `extraParams: { login_hint }`. This ensures Google pre-selects the correct account.

4. **Clean up incorrect data** — Remove the `user-management` entry from `user_app_access` for the org_admin user (`74b6dad0-3c2d-48e6-8ae0-97354597aa19`).

