

## Analysis

I investigated both issues in detail across `ContractDocument.tsx`, `ContractDetailsStep.tsx`, `EmployerSigningDialog.tsx`, `contract-translations.ts`, and `form-translations.ts`.

### Issue 1: Employee/employer information sometimes missing from the contract

**Root cause**: The `ContractDocument` reads employee data from `form_data` (e.g., `fd.firstName`, `fd.address`). When loading a saved contract, the code uses truthy checks like `if (fd.firstName) setFirstName(fd.firstName)`. Empty strings `""` are falsy in JavaScript, so if an employee field was saved as empty string in `form_data`, it won't be restored, AND the initial value from `employee.personal_info` gets overwritten to empty during the load sequence because `setInitialLoaded(true)` fires regardless.

Additionally, in `EmployerSigningDialog.tsx`:
- `employeeSignedAt` is **not passed** to `ContractDocument` (line 168-179), so the employee's signature date never shows
- The employee signature URL may reference a storage path that is invalid or requires authentication

**Fixes needed:**
1. In `ContractDetailsStep.tsx` loading logic (~lines 507-586): change all `if (fd.fieldName)` checks to `if (fd.fieldName !== undefined)` so that empty strings from saved data are properly restored, and original employee defaults only apply for genuinely missing fields
2. In `EmployerSigningDialog.tsx`: pass `employeeSignedAt={contract.employee_signed_at}` to the `ContractDocument` component
3. Add a cache-busting query param to the employee signature URL to prevent stale/broken images

### Issue 2: Translations incomplete for RO/SE and TH/SE in the contract wizard

**Root cause**: The wizard (`ContractDetailsStep.tsx`) has extensive hardcoded English/Swedish-only text that never gets translated when RO/SE or TH/SE is selected. The `getFormLabel()` function works for field labels, but many other UI elements bypass it:

- **Section 5 (Form of Employment)**: All employment form option labels ("Permanent employment from / Tillsvidareanställning från", "Probationary period...", "Seasonal employment...", etc.) are hardcoded EN/SV only
- **Section 3**: Helper text ("How many different job types will the employee have?"), "Required" warnings, "Reset" buttons, duplicate warnings
- **Section 4**: Collective agreement description text
- **Section 6**: Working time labels ("Full-time / Part-time")
- **Section 7**: Holiday text
- **Section 8**: Salary section labels, "Apply Rate" button
- **Place of Employment** descriptions (main rule, alternative rule, exception rule) - long legal text blocks
- **Progress bar** labels ("Parties", "Employment", "Compensation", "Others", "Review & Sign")
- **Button text**: "Back / Tillbaka", "Next Step / Nästa", "Exit / Avsluta"
- **Select placeholders**: "Select country...", "Pick the job type...", etc.

**Fixes needed:**
1. Add missing entries to `FORM_LABELS_RO` and `FORM_LABELS_TH` in `form-translations.ts` for all hardcoded strings
2. Create a helper function for inline bilingual text (currently many strings use the pattern `"English text / Swedish text"` directly) that can expand to include RO and TH
3. Update `ContractDetailsStep.tsx` to use `getFormLabel()` for all user-visible strings, replacing hardcoded `"English / Swedish"` patterns
4. Translate the Section 5 employment form option labels, Section 3 helper/warning text, and the Place of Employment legal descriptions

### Implementation Plan

**Step 1: Fix employee data loading bug**
- In `ContractDetailsStep.tsx`, change all `if (fd.fieldName)` to `if (fd.fieldName !== undefined)` in the loading block (lines 507-586)
- This ensures empty strings are preserved from saved data while truly missing fields still fall back to employee defaults

**Step 2: Fix employee signature display in EmployerSigningDialog**
- Pass `employeeSignedAt={contract.employee_signed_at}` to `ContractDocument`
- Add cache-busting to the employee signature URL

**Step 3: Expand translation dictionaries**
- Add ~40 new entries to `FORM_LABELS_RO` and `FORM_LABELS_TH` covering:
  - Employment form option labels (permanent, probationary, fixed-term, seasonal, etc.)
  - Section helper/description text
  - Button labels, placeholders, warnings
  - Legal text blocks (Place of Employment rules)

**Step 4: Update ContractDetailsStep to use translations throughout**
- Replace hardcoded `"English / Swedish"` inline strings with calls to `getFormLabel()` or a new bilingual helper
- Apply translations to Section 5 employment form options, Section 3 helper text, Section 4 collective agreement text, Section 6-8 labels, progress bar labels, and button text

### Technical Details

The main files affected:
- `src/lib/form-translations.ts` — add ~40 new Romanian and Thai translation entries
- `src/components/dashboard/ContractDetailsStep.tsx` — fix data loading; replace hardcoded strings with translation calls
- `src/components/dashboard/EmployerSigningDialog.tsx` — pass missing `employeeSignedAt` prop

