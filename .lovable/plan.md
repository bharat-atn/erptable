

## Plan: Fix Bank Registry — Add org_id to All Bank Inserts + Ensure Ukrainian Banks Appear

### Root Cause
The `BankListView.tsx` component never imports `useOrg()` or passes `org_id` when inserting banks. The `banks` table has a NOT NULL `org_id` column and RLS policies that check `is_org_member_current(org_id)`. Every insert — Add Bank, Seed Default Banks, CSV Import — is silently failing because `org_id` is missing.

This is why Ukraine (and potentially other seeded banks) never appear: the seed operation fails at the database level.

### Changes

**`src/components/dashboard/BankListView.tsx`**

1. **Import `useOrg`** from `@/contexts/OrgContext` and extract `orgId` via `const { orgId } = useOrg()`.

2. **Add `org_id: orgId` to every insert/query call:**
   - `addBank` mutation: add `org_id: orgId` to the insert payload
   - `seedDefaultBanks` function: add `org_id: orgId` to each insert payload
   - `importBanks` mutation: add `org_id: orgId` to each insert payload
   - Bank list query: filter by `.eq("org_id", orgId)` so each org sees only its own banks

3. **Remove `as any` casts** — once `org_id` is included, the type should match properly.

4. **Guard mutations** — disable the Add/Seed/Import buttons when `orgId` is null.

### Result
After this fix, clicking "Seed Default Banks" will correctly insert all 25 banks (including the 5 Ukrainian ones) into the registry for the current organization. Ukraine will appear in the country filter dropdown.

