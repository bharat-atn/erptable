

## Plan: Fix AI Test Data Generator Bank Auto-Fill in Candidate View

### Problem
When clicking "Ukrainian Worker" (or any nationality) in the AI Test Data Generator within the Candidate View preview, the bank section is not auto-filled. The BIC and account number fields get values, but the bank country dropdown and bank selection radio remain empty because:

1. `selectedBankCountry` (internal wizard state) is never set by the AI fill logic
2. `onBankSelect(bankName)` is never called from within the wizard after AI data arrives
3. The bank radio list stays collapsed/hidden since no country is selected

### Changes

**`src/components/onboarding/OnboardingWizard.tsx` — Update `handleAiFill` to also select bank country and bank**

After the existing field fills (around line 479), add logic to:

1. Derive the bank country from `data.country` (e.g., "Ukraine")
2. Set `setSelectedBankCountry(data.country)` if the country exists in `effectiveBanksByCountry`
3. If `data.bankName` exists and matches a bank in the fallback/merged list for that country, call `onBankSelect(data.bankName)` to select it
4. Set `setBankListExpanded(false)` to show the selected bank summary
5. Open the bank section (`setS4Open(true)`) so the user can see the auto-filled result

This ensures that after AI fill, the bank section shows: country selected → bank selected → BIC filled → account number filled — all in one click.

### Technical Detail

```typescript
// Inside handleAiFill, after existing field updates:
if (data.country) {
  const bankCountry = Object.keys(effectiveBanksByCountry).find(
    c => c.toLowerCase() === data.country.toLowerCase()
  );
  if (bankCountry) {
    setSelectedBankCountry(bankCountry);
    if (data.bankName) {
      onBankSelect(data.bankName);
      setBankListExpanded(false);
    } else {
      setBankListExpanded(true);
    }
  }
}
```

### Result
Clicking any nationality button in the AI Test Data Generator will fully populate the bank section — country, bank name, BIC code, and account number — providing a complete one-click demo experience.

