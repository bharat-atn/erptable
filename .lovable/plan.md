
Root cause confirmed from current code and request logs:

- The backend validator currently treats missing values as valid:
  - `dateOfBirth: ""` → `"valid": true, "No date of birth provided."`
  - `localNumber: ""` → `"valid": true, "No phone number provided"`
- `Continue` is enabled when `phone` + `dateOfBirth` are “valid”, so empty fields can still pass.
- The `profiles` table allows `date_of_birth` and `phone_number` to be null, and there is no DB-level validation trigger blocking this update.
- Cached validation can preserve this incorrect “empty-is-valid” state.

Implementation plan (focused, credit-safe, and robust):

1) Make required-field validation strict (backend function)
- Update `supabase/functions/validate-profile-fields/index.ts` so empty required fields are invalid:
  - missing DOB => invalid
  - missing phone local number => invalid
  - missing nationality => invalid
- Add deterministic input checks before any AI call (date format/canonical date, phone character and length sanity).
- Short-circuit early on missing/invalid required data to avoid spending AI credits unnecessarily.
- Keep AI only for consistency checks (nationality/language/country logic), not for requiredness.

2) Tighten the Welcome Back gate (frontend)
- Update `src/components/dashboard/LoginProfileDialog.tsx`:
  - Add `requiredComplete` guard (DOB + phone + nationality must be present).
  - Disable **Validate Fields** until required fields are filled.
  - Disable **Continue** unless required fields are complete AND validation passes.
  - Include `nationality` in pass criteria (currently not part of `hasErrors`).
  - Version the validation cache key (e.g. `profile-validation-v2-...`) so old “empty valid” cache entries cannot unlock Continue.

3) Add real database resistance (as requested)
- Add a migration trigger on `public.profiles` to reject incomplete identity updates for self-updates:
  - Reject null/blank `date_of_birth`, `phone_number`, `nationality` when profile identity fields are being submitted from user-side updates.
  - Return clear DB error messages so UI can show exact reason.
- Keep RLS as-is (it already restricts rows correctly); this change adds data integrity guardrails, not access changes.

4) Keep both profile surfaces consistent
- Use a shared completeness helper in `src/lib/profile-utils.ts` (or equivalent) so the same requiredness rules are used in:
  - `LoginProfileDialog` (mandatory gate)
  - Sidebar profile save flow (warn/block on clearing required identity fields)
- Optional small UX improvement in `ProfileIdentityFields`: show “Required” hint under DOB/phone/nationality to reduce failed validations.

5) Verification checklist (end-to-end)
- Empty DOB/phone → Validate stays blocked or returns invalid; Continue remains disabled.
- Partial/invalid phone → explicit error; Continue disabled.
- Valid DOB + valid phone + nationality → Validate passes; Continue enables.
- Attempt to bypass with direct update payload containing null identity fields → database rejects.
- Confirm no unnecessary AI calls when required fields are empty (reduced credit usage).

Technical details (implementation scope)
- Files to update:
  - `src/components/dashboard/LoginProfileDialog.tsx`
  - `src/components/profile/ProfileIdentityFields.tsx` (required UI hints/messages)
  - `src/lib/profile-utils.ts` (shared completeness guard)
  - `supabase/functions/validate-profile-fields/index.ts`
- New migration:
  - `supabase/migrations/<timestamp>_enforce_profile_identity_completeness.sql` (trigger-based validation on `public.profiles`)
- No changes needed to auth flow or RLS policy definitions for this fix.

```text
Current flow:
Empty DOB/phone -> validate-profile-fields returns valid -> Continue enabled -> DB accepts nulls

Planned flow:
Empty DOB/phone -> frontend required guard + backend invalid result -> Continue disabled
Attempted bypass -> DB trigger rejects incomplete profile update
```
