

## Plan: Remember validation state across sessions

### Problem
Currently, every time the dialog opens, validation is `null` and the user must click "Validate Fields" even if nothing changed. If the data is identical to what was last validated, we should skip re-validation.

### Approach
Use `localStorage` to persist a fingerprint of the last successfully validated fields (per user). On dialog load, compare the loaded profile values against the stored fingerprint. If they match, auto-restore the validation as passed — enabling "Continue" immediately.

### Changes in `src/components/dashboard/LoginProfileDialog.tsx`

1. **Define a fingerprint function** that creates a string hash from the validatable fields: `dialCode + localNumber + nationality + lang + dateOfBirth`.

2. **On successful validation** (when `handleValidate` returns all-valid results), save the fingerprint and the validation result to `localStorage` under a key like `profile-validation-${userId}`.

3. **On profile load** (in the existing `useEffect`), after setting all field states, compute the fingerprint from the loaded data and compare it to the stored one. If they match, restore the saved `ValidationResult` into state — so `validationPassed` is immediately `true` and the user can click "Continue" without re-validating.

4. **On any field change** (already resets `validation` to `null`), this naturally invalidates the state. The fingerprint comparison only happens on load.

### Files to modify
- `src/components/dashboard/LoginProfileDialog.tsx`

