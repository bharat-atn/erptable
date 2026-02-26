

## Plan: Improve Non-Google User Sign-In Experience

### Problem
Users with non-Google emails (like Apple/iCloud accounts) have no clear path to sign in. The temporary password set during invitation is never communicated to them, and there's no password reset flow.

### Changes

#### 1. Add "Forgot Password" flow to AuthForm
**File: `src/components/auth/AuthForm.tsx`**
- Add a "Forgot password?" link below the password field in the email/password form
- When clicked, show an input for email and call `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`
- Show a toast confirming the reset email was sent

#### 2. Create `/reset-password` page
**New file: `src/pages/ResetPassword.tsx`**
- Detects `type=recovery` token in URL hash
- Shows a form to set a new password
- Calls `supabase.auth.updateUser({ password })` to save the new password
- Redirects to the main app on success

**File: `src/App.tsx`**
- Add route for `/reset-password`

#### 3. Update the approval email to include sign-in instructions
**File: `supabase/functions/send-role-notification/index.ts`**
- Add clear instructions: "Sign in with Google if you have a Google account, or use email & password"
- Add a "Forgot password?" hint directing them to use the reset flow if they don't know their password
- If a temp password was set, mention that they can sign in with email/password (without revealing the password in the email for security)

#### 4. (Optional future) Add Apple Sign-In
Apple Sign-In is supported by Lovable Cloud and would let iCloud users sign in natively. This can be added later if needed.

### Impact
- Non-Google users can use "Forgot password?" to set their own password and sign in
- The approval email clearly explains both sign-in methods
- No database changes required

