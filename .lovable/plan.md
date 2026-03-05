

## Plan: Fix Bank List — Unique Constraint and Database Seeding

### Root Cause

I found the problem. There are actually **two issues**:

1. **Database constraint bug**: The `banks` table has a `UNIQUE(name)` constraint that is **not scoped to organization**. This means if org A already has "Nordea" in the database, org B cannot add "Nordea" — the insert fails silently. Your organization only has 15 banks in the database because the Seed Default Banks button fails for names that already exist in the other organization's records.

2. **Your organization needs re-seeding**: The 15 banks currently in the database for your organization were seeded with the old short list. After fixing the constraint, the Seed button needs to be pressed again to populate all 73 banks.

### Changes

**1. Database migration**: Drop `UNIQUE(name)` constraint and replace with `UNIQUE(org_id, name)`

```sql
ALTER TABLE public.banks DROP CONSTRAINT banks_name_unique;
ALTER TABLE public.banks ADD CONSTRAINT banks_org_name_unique UNIQUE (org_id, name);
```

This allows each organization to independently maintain its own bank registry with the same bank names.

**2. No code changes needed**: The `FALLBACK_BANKS_BY_COUNTRY` (73 banks) and `DEFAULT_BANKS` (73 banks) constants are already correctly expanded in the code. The `effectiveBanksByCountry` memo already merges fallback + DB banks. Once the constraint is fixed and banks are re-seeded, both the admin Bank List view and the onboarding invitation form will show the full list.

### Result
- The admin Bank List view will show all 73 banks after pressing "Seed Default Banks"
- The onboarding form (both invitation token mode and preview mode) will show all banks via the merge of fallback + DB banks
- Each organization can maintain its own independent bank registry

