

# Sync Top-Level Employee Fields from Onboarding Data

## The Problem
When a candidate submits the onboarding form, phone, city, and country are saved inside the `personal_info` JSONB column but the top-level `phone`, `city`, and `country` columns on the `employees` table stay empty. The Operations view reads from the top-level columns, so they show as dashes.

## The Fix
Update the `submit_onboarding` database function to extract `phone`, `city`, and `country` from the submitted `personal_info` JSONB and write them to the corresponding top-level columns.

## Database Migration

Update the `submit_onboarding` function so the employee UPDATE also sets:

```sql
phone = _personal_info->>'mobilePhone',
city = _personal_info->>'city',
country = _personal_info->>'country'
```

## Backfill Existing Data

For the employee who already submitted (Ove Eriksson), run a one-time backfill to populate the top-level columns from the existing `personal_info` data:

```sql
UPDATE employees
SET phone = personal_info->>'mobilePhone',
    city = personal_info->>'city',
    country = personal_info->>'country'
WHERE personal_info IS NOT NULL
  AND (phone IS NULL OR phone = '');
```

## Files Changed
- One new database migration (SQL only, no code files changed)

## Result
After this change, all future onboarding submissions will automatically populate the phone, city, and country columns visible in Operations. The existing employee record will also be fixed by the backfill.

