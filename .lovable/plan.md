

## Plan: Clean Up Profile Settings Dialog

### Changes to `src/components/dashboard/Sidebar.tsx` (UserProfileDialog)

1. **Remove emergency contact** — Delete the emergency contact field and its state (`emergencyContact`), the DB select/save of `emergency_contact`.

2. **Show password section to all users with Google warning** — Instead of hiding the password section for Google users (`!isGoogleUser`), always show it but:
   - Add an alert/notice for Google users explaining that changing password only applies to email/password login and won't affect their Google sign-in.
   - Keep the password inputs and button functional for all users (some may have both Google and email/password).

### Files to modify
- `src/components/dashboard/Sidebar.tsx` — Remove emergency contact, add Google auth warning to password section.

