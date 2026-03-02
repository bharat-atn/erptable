

## Plan: Unify Edit Profile Dialog with Shared Profile Fields

### Problem
The admin "Edit Profile" dialog in User Management uses plain text inputs without flags for nationality and language, while the "Welcome Back" login dialog uses the shared `ProfileIdentityFields` component with flag emojis and priority-sorted dropdowns. The emergency contact field is also still present despite being removed from other profile views.

### Changes

**File: `src/components/dashboard/UserManagementView.tsx` — `EditProfileDialog` component (lines 165-345)**

1. **Import and use `ProfileIdentityFields`** from `@/components/profile/ProfileIdentityFields` and `parsePhone`/`combinePhone` from `@/lib/profile-utils`
2. **Remove the `emergency_contact` field** entirely from the form state and save logic
3. **Remove the local `LANGUAGE_OPTIONS` constant** (lines 174-180) — no longer needed since `ProfileIdentityFields` uses the shared one from `ui-translations`
4. **Refactor form state** to use `ProfileData` shape (`fullName`, `avatarUrl`, `lang`, `dateOfBirth`, `dialCode`, `localNumber`, `nationality`) parsed from the fetched profile using `parsePhone`
5. **Replace the manual form fields** (nationality select, language select, phone input, date input) with a single `<ProfileIdentityFields>` component, keeping the admin-specific fields outside it:
   - Full Name and Email remain as-is (already in `ProfileIdentityFields`)
   - The "Welcome Back Dialog" checkbox toggle stays below
6. **Update `handleSave`** to recombine `dialCode + localNumber` via `combinePhone` before saving

This ensures the admin sees the exact same flags, priority sorting, and field layout as the user's own profile dialog — single source of truth.

### No other files change
The `ProfileIdentityFields` component already supports all needed fields. The `showAvatar` prop can be set to `false` for the admin dialog since avatar management isn't needed there.

