

## Authentication & User Management Flow — Verification Report

### What is in place and working correctly

1. **Google Sign-In (primary)**: Uses `lovable.auth.signInWithOAuth("google")` with `redirect_uri: window.location.origin`. This is correct per the Lovable Cloud OAuth docs — the redirect must match the current origin for the OAuth callback to complete.

2. **Email/Password Sign-In (secondary)**: Uses `supabase.auth.signInWithPassword()`. Correctly implemented with collapsible UI.

3. **Email/Password Sign-Up**: Uses `supabase.auth.signUp()`. Shows confirmation message to check email.

4. **Forgot Password**: Uses `supabase.auth.resetPasswordForEmail()` with `redirectTo: getAppOrigin() + "/reset-password"` — correctly points to the published domain.

5. **Reset Password Page** (`/reset-password`): Listens for `PASSWORD_RECOVERY` event, shows form, calls `supabase.auth.updateUser({ password })`. Route registered in `App.tsx`.

6. **Role-based access**: `useUserRole` hook fetches from `user_roles` table with priority ordering. No role = pending approval screen.

7. **Pending Approval**: Shows clean "Account Pending Approval" screen with sign-out button.

8. **Invite User (admin)**: Edge function creates user via `admin.createUser()`, assigns role, sets profile to approved, grants app access. Supports optional fallback password.

9. **Role Assignment + Notification**: Uses `assign_user_role` RPC (SECURITY DEFINER). Sends approval email via Resend with `loginUrl: "https://erptable.lovable.app"` — correctly hardcoded.

10. **Approval Email Content**: Includes instructions for both Google and email/password users ("Click Forgot password? to set your own password").

11. **Self-demotion protection**: Handled by the `assign_user_role` RPC.

12. **Audit logging**: Auth events, role changes, and invitations are all logged.

### Issues Found — None Critical

All flows are properly connected. No broken links, no missing routes, no incorrect redirects remaining.

**Verdict: The system is complete and secure.** All authentication paths (Google sign-in, email/password sign-in, sign-up, forgot password, password reset, admin invitation, role assignment, approval notification) are wired up correctly. No code changes needed.

