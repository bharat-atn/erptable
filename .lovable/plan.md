
Goal: stop the white-screen crash in production by removing the risky “listed bank vs other bank” toggle flow and replacing it with one simple, stable bank-name input.

Issue diagnosis (rephrased):
- The crash happens in the onboarding invitation bank section when toggling “My bank is not in the list”.
- Current implementation mixes:
  1) conditional mount/unmount of bank country + bank list UI,
  2) many synchronized local + parent state resets,
  3) popover/select-style interactive components.
- That creates high-risk render timing and DOM reconciliation conflicts in this section.

Do I know what the issue is?
- Yes: the bank section architecture is over-complex and fragile (toggle-driven dual flow + cascading resets). Even after patch attempts, this design is still causing white-screen runtime failures.

Implementation plan

1) Rebuild Bank Information section into a single-path flow (no toggle)
- File: `src/components/onboarding/OnboardingWizard.tsx`
- Remove from Section 3 UI:
  - “Select Country” for bank
  - Bank dropdown list flow
  - “My bank is not in the list” checkbox card
  - `otherBankName` conditional input
- Replace with:
  - Always-visible plain `<Input>` for `bankName` (manual typing)
  - Keep existing BIC and Bank Account fields (required, editable)

2) Remove fragile bank state machinery from the wizard
- File: `src/components/onboarding/OnboardingWizard.tsx`
- Remove bank-specific dual-flow states and sync effects:
  - `selectedBankCountry`, `selectedBankValue`, country->bank memo lists, toggle reset logic
  - bank list fetch effect for onboarding (`get_onboarding_banks_by_token` / `banks` table) if no longer used
- Keep only `formData.bankName`, `formData.bicCode`, `formData.bankAccountNumber` as source of truth.

3) Simplify validation rules to match new UX
- File: `src/components/onboarding/OnboardingWizard.tsx`
- Update `s4Missing` logic:
  - Required: `bankName`, `bicCode`, `bankAccountNumber`
  - Remove requirements tied to selected bank country or toggle mode
- Keep schema requirement for `bankName` as required string.
- Optionally keep `otherBankName`/`bankCountryName` schema keys temporarily for backward compatibility, but they should no longer drive UI.

4) Update submit pipelines to use one bank field everywhere
- Files:
  - `src/pages/OnboardingPortal.tsx`
  - `src/components/dashboard/OnboardingPreview.tsx`
- Remove `selectedBank` + `isOtherBank` state and `handleBankSelect`.
- In submit payloads, set:
  - `bankName: validated.bankName` (or `data.bankName`) directly
- Remove bankName override in `handleSubmit` pre-validation object.

5) Align wizard call-sites with new props
- Files:
  - `src/pages/OnboardingPortal.tsx`
  - `src/components/dashboard/OnboardingPreview.tsx`
  - `src/components/dashboard/SubmissionViewDialog.tsx`
- Remove obsolete props passed to `OnboardingWizard`:
  - `selectedBank`, `isOtherBank`, `onBankSelect`
- Update `OnboardingWizardProps` accordingly.

6) Production hardening
- File: `src/pages/OnboardingPortal.tsx`
- Actually wrap the rendered wizard with existing `OnboardingErrorBoundary` so runtime issues fail gracefully instead of blank white screen.
- Optional extra hardening in onboarding root: add `translate="no"` on critical interactive container to reduce browser-translation DOM mutation risks observed with Radix/popover-heavy UIs.

Technical details (for implementation)
```text
Before:
Bank country select -> bank dropdown OR toggle "other bank" -> many reset calls

After:
Bank name text input (single path)
+BIC text input
+Account text input
No conditional bank mode switching
No bank-country dependent rendering
```

Regression test checklist (must run end-to-end)
1. On `/onboard/:token`, type in Bank Name, BIC, Account → no blank screen.
2. Rapid typing/clicking in Section 3 → no crash.
3. Submit succeeds with manual bank name.
4. AI-fill still works and does not overwrite/crash bank section unexpectedly.
5. Admin preview (`OnboardingPreview`) and submission read-only view still render correctly.

Expected outcome:
- The crashing interaction is eliminated entirely (because the toggle flow is removed).
- UX is simpler: users just type their bank name.
- Lower maintenance risk and higher production stability in onboarding.
