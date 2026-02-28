
## Fix Plan: Super-admin bypass not triggering after login

1. Update `src/contexts/OrgContext.tsx` to make org loading auth-aware:
   - At start of `fetchOrgs`, call `supabase.auth.getSession()`.
   - If no authenticated user: clear `orgs`, clear `currentOrgId`, remove `sessionStorage.currentOrgId`, set `loading=false`, return.
   - Always set `loading=true` at fetch start and `loading=false` in `finally`.

2. Refetch organizations on auth changes inside `OrgProvider`:
   - Add `supabase.auth.onAuthStateChange` listener.
   - On `SIGNED_IN` / `TOKEN_REFRESHED`: run `fetchOrgs()` so org list and super-admin status are evaluated with authenticated context.
   - On `SIGNED_OUT`: hard-reset org state (`orgs=[]`, `currentOrgId=null`, remove sessionStorage key).

3. Fix org auto-selection logic in `fetchOrgs`:
   - Keep bypass only for super admin (`is_super_admin()` true): auto-select saved org if valid, otherwise first org.
   - Remove the non-super-admin auto-select path for `enriched.length === 1` so admins/managers/org users must pick an org.
   - For non-super-admin users: if no valid saved org, keep `currentOrgId=null` to force picker.

4. Update `src/pages/Index.tsx` loading gate:
   - Read `loading` from `useOrg()` (e.g. `const { orgId, loading: orgLoading } = useOrg()`).
   - Include `orgLoading` in the top spinner condition so UI waits for post-login org refresh before deciding between picker/app launcher.

5. Keep membership-filtered picker behavior as-is:
   - No DB/RLS change needed; picker list already follows memberships managed in User Management.
   - This fix ensures that membership-filtered query runs after auth, so users see correct orgs.

## Technical details
- Files to change:
  - `src/contexts/OrgContext.tsx` (primary fix)
  - `src/pages/Index.tsx` (loading synchronization)
- No migration needed.
- No backend function change needed.

## Verification checklist
1. Log in as super admin: should go directly to App Launcher (no org picker stop).
2. Log in as org_admin/manager-level user: should see Organization Picker and must select org.
3. Confirm picker shows only organizations assigned via User Management memberships.
4. Sign out and sign in again as non-super-admin: should be required to pick org again.
