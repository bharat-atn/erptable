

## Plan: Three Changes

### 1. Hide User Management from non-super-admin users in sidebar app switcher

The sidebar `AppSwitcherHeader` currently shows all `enabled` apps without any role filtering. It needs to apply the same `adminOnly` / `allowedRoles` check that the App Launcher uses.

**Files:** `src/components/dashboard/Sidebar.tsx`
- Pass `userRole` into `AppSwitcherHeader`
- Filter `enabledApps` to exclude apps where `adminOnly === true && userRole !== "admin"` and apps whose `allowedRoles` don't include the current role (matching App Launcher logic)

### 2. Show profile welcome dialog on login with "Don't show again" toggle

After login, before entering the App Launcher, show a welcome/profile dialog displaying the user's current settings (name, avatar, preferred language, birthday, phone). The user can review and update these fields. A "Don't show this on login" toggle persists to the `profiles` table so it's respected across devices.

**Database migration:**
- Add columns to `profiles`: `date_of_birth` (date, nullable), `phone_number` (text, nullable), `emergency_contact` (text, nullable), `nationality` (text, nullable), `skip_login_profile` (boolean, default false)

**Files:**
- `src/pages/Index.tsx` — After session + role + org are resolved but before showing the App Launcher, check `profiles.skip_login_profile`. If false, show a `LoginProfileDialog`. Once dismissed, proceed to launcher.
- New component `src/components/dashboard/LoginProfileDialog.tsx` — Modal with:
  - Avatar display
  - Full name (read-only or editable)
  - Email (read-only)
  - Preferred language selector
  - Birthday (date picker)
  - Phone number
  - Emergency contact
  - Nationality
  - Toggle: "Don't show this on login"
  - "Continue" button to dismiss

### 3. Expand UserProfileDialog with additional fields

The existing `UserProfileDialog` in the sidebar should also include the new profile fields (birthday, phone, emergency contact, nationality) so users can update them anytime, not just on login.

**Files:** `src/components/dashboard/Sidebar.tsx` — Add input fields for the new columns in the `UserProfileDialog` component.

### Summary of files to change
- **Migration**: Add 5 columns to `profiles`
- `src/components/dashboard/Sidebar.tsx`: Filter app switcher by role; add profile fields to UserProfileDialog
- `src/pages/Index.tsx`: Add login profile prompt logic
- New: `src/components/dashboard/LoginProfileDialog.tsx`

