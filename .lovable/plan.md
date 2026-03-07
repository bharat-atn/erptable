

## Plan: Allow Letters and Numbers in Bank Account Number and BIC Code Fields

### Problem
The bank account number field in the Onboarding Wizard currently strips all non-digit characters (`/\D/g` replacement) and validates with `/^\d+$/`. IBAN codes (e.g., `SE3550000000054910000003`) contain letters, so this restriction is wrong. The BIC code field already accepts letters — no change needed there.

### Changes

**File: `src/components/onboarding/OnboardingWizard.tsx`**

1. **Update `isBankAccountValid` function** (~line 194): Change regex from `/^\d+$/` to `/^[A-Za-z0-9]+$/` (alphanumeric)

2. **Update Zod schema** (~line 224): Change `.refine((val) => /^\d+$/.test(val), ...)` to `.refine((val) => /^[A-Za-z0-9]+$/.test(val), ...)` with updated message

3. **Remove digit-stripping in onChange** (~line 1348): Change `e.target.value.replace(/\D/g, "")` to `e.target.value.replace(/[^A-Za-z0-9]/g, "")` (allow letters, strip only special chars)

4. **Update inputMode** (~line 1345): Remove `inputMode="numeric"` (or change to `"text"`)

5. **Update placeholder** (~line 1351): Change from `"Digits only"` to `"Letters and digits"` (or similar)

6. **Update error message** (~line 1355): Change "digits only" text to "letters and digits only"

7. **Update missing-field label** (~line 777): Change `"Account Number (digits only)"` to `"Account Number (invalid characters)"`

All changes are in a single file.

