

## Plan: Fix Profile Settings Dialog — Missing Translations and Consistency with Login Dialog

### Problem
The sidebar Profile Settings dialog has two issues:
1. **Missing translation keys**: `profile.personalInfo`, `profile.dateOfBirth`, `profile.phoneNumber`, `profile.emergencyContact`, `profile.nationality`, and `profile.saveChanges` are referenced via `t()` but never defined in `ui-translations.ts`, so they render as raw key strings (visible in the screenshot).
2. **Inconsistent with Login Profile Dialog**: The sidebar profile uses a native `<input type="date">` (browser-locale-dependent), a plain phone text input (no dial code selector), and a plain text input for nationality (no flag dropdown). The LoginProfileDialog already has proper ISO-format text input for dates, dial-code phone selector, and nationality dropdown with flags.

### Changes

#### 1. `src/lib/ui-translations.ts`
Add the 6 missing translation keys:
- `profile.personalInfo` — "Personal Information" / "Personuppgifter" / "Informații personale"
- `profile.dateOfBirth` — "Date of Birth" / "Födelsedatum" / "Data nașterii"
- `profile.phoneNumber` — "Phone Number" / "Telefonnummer" / "Număr de telefon"
- `profile.emergencyContact` — "Emergency Contact" / "Kontaktperson vid nödsituation" / "Contact de urgență"
- `profile.nationality` — "Nationality" / "Nationalitet" / "Naționalitate"
- `profile.saveChanges` — "Save Changes" / "Spara ändringar" / "Salvează modificările"

#### 2. `src/components/dashboard/Sidebar.tsx` — `UserProfileDialog`
Upgrade the profile fields section to match LoginProfileDialog:
- **Date of Birth**: Replace `<Input type="date">` with `<Input type="text">` using ISO format placeholder (same as LoginProfileDialog).
- **Phone Number**: Replace plain text input with dial-code `<Select>` + local number `<Input>`, using the same `parsePhone()` logic, priority dial codes, and country list as LoginProfileDialog.
- **Nationality**: Replace plain text input with a `<Select>` dropdown using `getOrderedNationalities()` with flag emojis, same as LoginProfileDialog.
- **Save handler**: Update `handleSaveProfileFields` to combine `dialCode + localNumber` before saving, matching the LoginProfileDialog pattern.

### Files to modify
- `src/lib/ui-translations.ts` — Add 6 missing keys
- `src/components/dashboard/Sidebar.tsx` — Upgrade UserProfileDialog fields

