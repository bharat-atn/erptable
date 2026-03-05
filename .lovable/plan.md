

## Plan: Show All Banks in Onboarding Invitation

### Problem
When a candidate opens the onboarding form via an invitation token, the bank list only shows banks fetched from the database for that organization. If the organization hasn't seeded all banks, or if some banks are missing from the DB, the candidate sees an incomplete list. The fallback banks (hardcoded in `FALLBACK_BANKS_BY_COUNTRY`) are intentionally excluded in token mode (line 518 of OnboardingWizard.tsx).

### Fix

**File: `src/components/onboarding/OnboardingWizard.tsx`**

Change the `effectiveBanksByCountry` memo (lines 516-540) to **always merge** fallback banks with DB banks, regardless of whether it's token mode or not. This ensures candidates always see at least the standard banks for Sweden, Romania, Thailand, Moldova, and Ukraine, plus any additional banks the organization has registered.

Current logic:
```typescript
if (invitationToken && Object.keys(banksByCountry).length > 0) {
  return banksByCountry; // Token mode: DB only, no fallback
}
// Demo/preview: merge fallback + DB
```

New logic:
```typescript
// Always merge fallback + DB banks (both token and demo/preview modes)
const merged = {};
mergeBanks(FALLBACK_BANKS_BY_COUNTRY);
mergeBanks(banksByCountry); // DB banks override fallback if same name
return merged;
```

This is a single change (~5 lines) in the memo function. No other files need modification.

