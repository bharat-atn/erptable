
Goal: Make the Welcome Back flow stable, keep birthday formatting aligned with ISO settings, and make sidebar Profile use the same database-backed data model/UI logic as Welcome Back.

Implementation steps:
1) Stabilize the Welcome Back close (X) behavior
- Update `src/components/ui/dialog.tsx` to support an optional prop like `hideDefaultClose` (default false) so dialogs can fully control close UI when needed.
- In `src/components/dashboard/LoginProfileDialog.tsx`, hide default close and render an explicit, always-visible top-right close button with strong contrast and fixed hit area.
- Keep `onOpenChange` fallback (`!isOpen => signOut`) and explicitly prevent outside/Escape accidental dismiss so only the visible X controls exit.

2) Make date handling deterministic and ISO-driven across dialogs
- Add shared date helpers in a new utility (e.g. `src/lib/profile-date-utils.ts`):
  - read current ISO date format setting from `iso-standards-settings`
  - format DB ISO date (`YYYY-MM-DD`) to display format
  - parse display format back to ISO canonical format
  - strict validation for supported formats (`YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`, `DD.MM.YYYY`)
- Use canonical ISO value for all saves, validation payloads, and fingerprint cache.
- Use display value only for UI, so displayed date stays consistent with configured ISO setting and does not “flip back” unexpectedly.

3) Remove divergence between Welcome Back and Sidebar Profile
- Extract shared profile identity form block (new component, e.g. `src/components/profile/ProfileIdentityFields.tsx`) for:
  - full name
  - email (read-only)
  - preferred language
  - date of birth (shared parser/formatter)
  - phone (dial code + local number)
  - nationality (same dropdown + flags)
- Reuse this shared block in:
  - `LoginProfileDialog` (with Validate + Continue + skip toggle)
  - `Sidebar` `UserProfileDialog` (with Save Changes and optional extra sections like password/emergency contact)
- Ensure both dialogs load/save the same profile columns with the same transform rules (`full_name`, `preferred_language`, `date_of_birth`, `phone_number`, `nationality`, `skip_login_profile`, `avatar_url`).

4) Align wording/translations so text is consistent
- Add/use translation keys for Welcome Back labels/buttons/messages currently hardcoded in English.
- Reuse the same text keys in both dialogs where fields overlap.

5) Regression-proofing
- Keep one shared phone/date mapper utility instead of duplicate `parsePhone*` and ISO readers in multiple files.
- Keep validation fingerprint based on canonical ISO date + canonical phone/nationality/lang values to avoid false invalidations.

Technical details:
- Files to update:
  - `src/components/dashboard/LoginProfileDialog.tsx`
  - `src/components/dashboard/Sidebar.tsx`
  - `src/components/ui/dialog.tsx`
  - `src/lib/ui-translations.ts`
- Files to add:
  - `src/lib/profile-date-utils.ts`
  - `src/components/profile/ProfileIdentityFields.tsx` (or equivalent shared component path)
- Backend/database changes:
  - None required (existing `profiles.date_of_birth` as `date` remains correct).

Verification checklist:
1. Welcome Back shows a visible X in top-right on every load.
2. Clicking X reliably signs out and returns to login (not company picker/app).
3. Date format follows current ISO setting in both Welcome Back and Sidebar Profile.
4. Save in Sidebar Profile is reflected exactly in next Welcome Back open.
5. Validate/Continue still works with age check and cached validation.
6. Test end-to-end on both desktop and mobile viewport to confirm no UI regressions.
