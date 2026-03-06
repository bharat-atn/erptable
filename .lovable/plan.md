

## Plan: Make Bank Seeding Robust and Self-Healing

### Current State

The database constraint is now fixed (`UNIQUE(org_id, name)` instead of `UNIQUE(name)`). However, one organization still has only 58 banks instead of 73 because the old constraint blocked seeding. The code has several weaknesses that allowed this to happen silently.

### Root Causes of Silent Bank Loss

1. **Seed function silently swallows errors**: In `BankListView.tsx` line 459, `if (!error) added++` means failed inserts are silently skipped with no warning to the user.
2. **One-by-one inserts are fragile**: Banks are inserted individually in a loop, so partial failures leave the registry incomplete without any indication.
3. **No verification after seeding**: The function never checks whether the final count matches the expected 73 banks.

### Changes

**1. `BankListView.tsx` — Rewrite `seedDefaultBanks` to use batch upsert with verification**

Replace the current one-by-one insert loop with:
- A single batch upsert using `.upsert()` with `onConflict: 'org_id,name'` so existing banks get their BIC codes updated rather than skipped.
- After upsert, verify the total bank count matches `DEFAULT_BANKS.length` (73).
- If the count is lower, show an explicit warning toast with the difference.
- Show a summary toast: "73/73 banks verified" or "Added 15 new banks, updated 58 existing".

**2. `BankListView.tsx` — Add a count badge next to "Seed Default Banks" button**

Show `{banks.length} / {DEFAULT_BANKS.length}` next to the seed button so admins can instantly see if the registry is incomplete.

**3. `OnboardingWizard.tsx` — No changes needed**

The fallback merge logic already ensures candidates always see all 73 banks regardless of what's in the database. This acts as a safety net.

### Result
- Pressing "Seed Default Banks" will upsert all 73 banks in one operation — no more silent partial failures
- Admins can see at a glance whether their bank registry is complete
- The fallback merge in the onboarding form continues to act as a safety net for candidates

