

## Plan: Fix Salary Warning Translation and Block Next Step

### Problem 1: Warning Not Bilingual
The `getSalaryWarning` function uses `getFormLabel()` which returns only the translated string (e.g., Romanian only). It should produce bilingual output like "Romanian text / Swedish text" — matching how all other text in the wizard works via `bl()`.

### Problem 2: Next Step Not Blocked
When the salary warning is active, the "Next Step" button should be disabled to prevent submitting a contract with pay below the collective agreement minimum.

### Changes

**`src/components/dashboard/ContractDetailsStep.tsx`**

1. **Rewrite `getSalaryWarning`** (lines 2432-2448): Instead of using `getFormLabel` with a key, use `bl()` directly with the EN string and SV string, both with values already substituted. The `bl()` function will automatically look up RO/TH/UK translations via `getFormBilingual`. To make this work, add the EN warning strings (with `{value}` and `{min}` already replaced) as dictionary keys won't work — instead, construct the translated+SV string manually using `getFormLabel` for the primary language and then appending the Swedish version.

   Revised approach: Build the warning using the template from each dictionary, substitute `{value}`/`{min}`, then format as bilingual (primary + " / " + Swedish) based on `contractLanguage`.

2. **Add salary-below-minimum check to `isNextDisabled`** (line 1030): For `activeSection === "section-8"`, compute whether any job type has a salary below the official rate and include that in the disabled condition.

**`src/lib/form-translations.ts`**

No changes needed — the translation keys already exist for RO, TH, and UK.

### Result
- Warning text displays bilingually (e.g., "Salariul de bază introdus... / Den angivna grundlönen...") matching the contract language mode
- Next Step button is disabled whenever the salary warning is visible, preventing contracts with below-minimum pay from advancing

