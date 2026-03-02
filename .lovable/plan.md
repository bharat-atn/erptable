

## Plan: Add "Other Country" Option to Bank Country Selector

### Problem
If a candidate's country (e.g., Ukraine) is not in the bank registry, the country dropdown has no matching option. Since the bank list only appears after selecting a country, the candidate is completely blocked from entering bank information.

### Changes

**`src/components/onboarding/OnboardingWizard.tsx`**

1. **Add "Other country" option to the country `<select>`** — After the registered countries, add an "Other country / Annat land" option with a special value like `"__other__"`.

2. **When "Other country" is selected**, skip the bank radio list entirely and show the manual bank name input directly (same as the existing "Other Bank" flow). Set `isOtherBank` to true automatically and show BIC + account number fields.

3. **Add a free-text country name input** when "Other country" is chosen, so the candidate can type their actual country (e.g., "Ukraine"). This value gets saved to `bankCountry` in the submission.

4. **Add Ukraine to `FALLBACK_BANKS_BY_COUNTRY`** with common Ukrainian banks (PrivatBank, Monobank, PUMB, Oschadbank) so that Ukraine appears in the country dropdown by default in demo/preview mode.

5. **Update validation** — `s4Missing` logic: when "Other country" is selected, require the typed country name instead of the dropdown value.

### Flow After Fix
- Candidate opens Bank Information section
- Country dropdown shows: Moldova, Romania, Sweden, Thailand, Ukraine, **Other country / Annat land**
- If they pick a listed country → existing bank radio list flow
- If they pick "Other country" → free-text country input + free-text bank name + BIC + account number fields appear directly

