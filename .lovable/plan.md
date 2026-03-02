

## Plan: Add BIC Codes to Banks + Auto-fill on Selection + Seed Ukrainian Banks

### Problem
1. The fallback bank list in the onboarding wizard has `bic_code: null` for all banks, so selecting a bank never auto-fills the BIC code.
2. Selecting a bank doesn't auto-generate a plausible account number.
3. Ukrainian banks are not in the bank registry (settings), only in the fallback list.

### Changes

**1. `src/components/onboarding/OnboardingWizard.tsx` — Add real BIC codes to FALLBACK_BANKS_BY_COUNTRY**

Replace all `bic_code: null` entries with actual BIC/SWIFT codes:

- Sweden: Swedbank → SWEDSESS, SEB → ESSESESS, Nordea → NDEASESS, Handelsbanken → HANDSESS
- Romania: Banca Transilvania → BTRLRO22, BCR → RNCBROBU, BRD → BRDEROBU, CEC → CECEROBU, ING → INGBROBU, UniCredit → BACXROBU, Raiffeisen → RZBRROBU
- Thailand: Bangkok Bank → BKKBTHBK, Kasikornbank → KASITHBK, Krungthai → KRTHTHBK, SCB → SICOTHBK
- Moldova: maib → AGRNMD2X, Moldindconbank → MOLDMD2X, OTP → OTPVMD22, Victoriabank → VICBMD2X
- Ukraine: PrivatBank → PBANUA2X, Monobank → UABORUA, PUMB → FUIBUA2X, Oschadbank → ABORUA2X, Raiffeisen Bank Aval → AVALUA2X

**2. `src/components/onboarding/OnboardingWizard.tsx` — Auto-generate account number on bank selection**

When a bank is selected (in the `onValueChange` handler around line 1241), after auto-filling the BIC code, also generate a random digits-only account number with the correct length for that country:
- Sweden: 11 digits
- Romania: 16 digits (IBAN numeric part)
- Thailand: 10 digits
- Moldova: 16 digits
- Ukraine: 14 digits (UAH IBAN numeric part)
- Default: 12 digits

This only applies in preview/demo mode (when `showAiFill` is true) to avoid overwriting real user data.

**3. `src/components/dashboard/BankListView.tsx` — Add "Seed Ukrainian Banks" capability**

No separate seeding needed. Instead, add a note: the user can manually add Ukrainian banks via the existing "Add Bank" button in Settings → Bank List. The banks with BIC codes are already available in the fallback list for the onboarding form.

Alternatively, add a small helper: a "Seed Default Banks" button or simply document that users should add banks via the UI. Since the user specifically said "those banks should go into the bank list in the settings also", we will add an auto-seed mechanism.

**Better approach**: Add a "Seed Ukrainian Banks" action in BankListView that inserts the 5 Ukrainian banks with their BIC codes if they don't already exist in the registry.

In `BankListView.tsx`, add a dropdown option or button "Add Default Ukrainian Banks" that inserts:
- PrivatBank / PBANUA2X / Ukraine
- Monobank / UABORUA / Ukraine
- PUMB / FUIBUA2X / Ukraine
- Oschadbank / ABORUA2X / Ukraine
- Raiffeisen Bank Aval / AVALUA2X / Ukraine

This will use the existing `addBank` mutation pattern, inserting all 5 in one batch.

### Technical Details

**Account number generation helper** (only in preview/demo):
```typescript
const ACCOUNT_LENGTHS: Record<string, number> = {
  Sweden: 11, Romania: 16, Thailand: 10, Moldova: 16, Ukraine: 14
};

function generateRandomAccountNumber(country: string): string {
  const len = ACCOUNT_LENGTHS[country] || 12;
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
}
```

### Result
- Selecting a bank auto-fills the correct BIC code and (in preview mode) a plausible account number.
- Ukrainian banks can be bulk-added to the settings registry with correct BIC codes.

