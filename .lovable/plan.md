

## Plan: Fix AI Test Data Generator — Bank Selection and Emergency Contact

### Problem 1: Swedish Bank Auto-Selection
When generating a Swedish worker, the system auto-selects a bank name from the AI response. Swedish workers should instead see the bank list open so they can pick a bank themselves — only the country should be pre-selected.

### Problem 2: Emergency Contact Not Populated
The AI edge function does generate emergency contact data (`emergencyFirstName`, `emergencyLastName`, `emergencyPhonePrefix`, `emergencyPhoneNumber`), and the wizard code handles mapping them. However, the data may not reliably appear because:
- The AI sometimes returns inconsistent field names
- The emergency contact section (`s3Open`) is not explicitly opened after AI fill, so even if data is set, the user might not see it

### Changes

**`src/components/onboarding/OnboardingWizard.tsx` — `handleAiFill` function (~lines 482-496)**

1. Skip bank auto-selection for Swedish workers. Change the logic so that when `data.country === "Sweden"`, only `selectedBankCountry` is set and `bankListExpanded` is left `true` (no `onBankSelect` call). For all other nationalities, keep current behavior.

2. After all fields are filled, explicitly open the emergency contact section: `setS3Open(true)`.

3. Add fallback handling for emergency contact phone — if the AI only returns `emergencyPhone` as a combined string (instead of prefix+number), handle that too.

### Technical Detail

```typescript
// Bank selection: skip auto-select for Sweden
if (data.country) {
  const bankCountry = Object.keys(effectiveBanksByCountry).find(
    c => c.toLowerCase() === data.country.toLowerCase()
  );
  if (bankCountry) {
    setSelectedBankCountry(bankCountry);
    if (data.bankName && data.country.toLowerCase() !== "sweden") {
      onBankSelect(data.bankName);
      setBankListExpanded(false);
    } else {
      setBankListExpanded(true);
    }
    setS4Open(true);
  }
}

// Ensure emergency contact section is visible
setS3Open(true);
```

### Result
- Swedish workers: bank country set to Sweden, bank list shown open for manual selection
- All nationalities: emergency contact fields populated and section expanded so the user can verify the data

