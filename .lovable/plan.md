

## Plan: Fix Employer Signing — RLS, Experience Level, Place, Upload

### Issue 1: RLS Error on Employer Signature Upload (Critical)
The screenshot shows "new row violates row-level security policy" when submitting the employer signature. The `employer/` folder in the `signatures` bucket has an INSERT policy for HR users, but **no UPDATE policy**. Since the code uses `upsert: true`, Supabase needs both INSERT and UPDATE policies.

**Fix:** Add a migration with an UPDATE policy for the `employer/` folder for HR users.

```sql
CREATE POLICY "HR can update employer signatures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = 'employer' AND (SELECT is_hr_user()))
WITH CHECK (bucket_id = 'signatures' AND (storage.foldername(name))[1] = 'employer' AND (SELECT is_hr_user()));
```

### Issue 2: Experience Level Not Displaying Properly in Contract §3
The `ContractDocument.tsx` renders `fd.experienceLevel` as-is, which is the raw stored value like `"Entry Level / Nybörjare (0 years / < 1 season / 0 år / < 1 säsong)"`. The user wants it translated per contract language. The `getExperienceLevelLabel` function already exists in `ContractDetailsStep.tsx` but isn't used in `ContractDocument.tsx`.

**Fix:** Move `EXPERIENCE_LEVELS_BASE` and `getExperienceLevelLabel` to a shared location (e.g. `contract-translations.ts`) and use it in `ContractDocument.tsx` to render the experience level with proper translation based on the contract language.

### Issue 3: Employee Signing Place Should Default to "Ljungaverk"
In the contract document signature section, the employee's Place field should show "Ljungaverk" (the company location). This should be set as the default `signingPlace` value in both `ContractSigning.tsx` and `SigningSimulation.tsx`.

**Fix:** In `ContractSigning.tsx` and `SigningSimulation.tsx`, after loading contract data, set `signingPlace` default to the company city/address (e.g., from contract `companyCity` or `form_data.companySnapshot.city`). If not available, fall back to "Ljungaverk".

### Issue 4: Employer Upload Signature Option
The `EmployerSigningDialog` already has a "Use saved signature" option from the profile's `default_signature_url`. The user wants an additional option to **upload a signature image file** directly during the counter-signing flow (not just draw or use saved).

**Fix:** Add a file upload button (`<input type="file" accept="image/png,image/jpeg">`) in `EmployerSigningDialog.tsx` that reads the file as a data URL and sets it as `pendingSignature`, alongside the existing draw and saved-signature options.

### Files to Edit

| File | Change |
|------|--------|
| Migration (new) | Add UPDATE storage policy for `employer/` folder |
| `src/lib/contract-translations.ts` | Export `EXPERIENCE_LEVELS_BASE` and `getExperienceLevelLabel` |
| `src/components/dashboard/ContractDetailsStep.tsx` | Import from shared location instead of local definition |
| `src/components/dashboard/ContractDocument.tsx` | Use `getExperienceLevelLabel` to render experience levels in §3 |
| `src/pages/ContractSigning.tsx` | Default `signingPlace` to company city |
| `src/pages/SigningSimulation.tsx` | Default `signingPlace` to company city |
| `src/components/dashboard/EmployerSigningDialog.tsx` | Add file upload option for signature |

