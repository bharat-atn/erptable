

## Fix: "no unique or exclusion constraint matching the ON CONFLICT specification"

### Root Cause
The `generate_contract_code()` trigger function fires when `signing_status` changes to `employer_signed`. Inside it, there's this SQL:

```sql
INSERT INTO public.contract_id_year_counters (year, next_number, issued_count)
VALUES (_year, 1, 0)
ON CONFLICT (year) DO NOTHING;
```

But the unique constraint on `contract_id_year_counters` is on `(org_id, year)`, not just `(year)`. This mismatch causes the error.

### Fix
Update the `generate_contract_code()` function to:
1. Resolve the contract's `org_id` from the `NEW` record
2. Include `org_id` in the INSERT and use `ON CONFLICT (org_id, year)`
3. Filter the `SELECT next_number` query by `org_id` as well
4. Filter the counter UPDATE by `org_id`

**Single migration** — replace the function body to use `org_id` consistently with the existing unique constraint.

### File
- Database migration only (no frontend code changes needed)

