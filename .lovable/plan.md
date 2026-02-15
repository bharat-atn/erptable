

# Add Active/Inactive Toggle to Positions for Contract Selection

## Overview
Add a checkbox to each position in the Contract Data Registry so HR staff can control which positions appear in the contract wizard's job type dropdown. Only "active" positions will show up when building a contract.

## Current State
- The Contract Data Registry (`ContractDataRegistryView.tsx`) manages positions in the `positions` table with columns: `label_en`, `label_sv`, `type_number`, `type_label_en`, `type_label_sv`, `sort_order`.
- The contract wizard (`ContractDetailsStep.tsx`) uses a **hardcoded** `JOB_TYPES` array (lines 67-108) instead of fetching from the database.

## Changes Required

### 1. Database Migration
Add an `is_active` boolean column to the `positions` table, defaulting to `true` so all existing positions remain visible.

```sql
ALTER TABLE public.positions
  ADD COLUMN is_active boolean NOT NULL DEFAULT true;
```

### 2. Contract Data Registry UI (`ContractDataRegistryView.tsx`)
- Add a checkbox to the left of each position row in the Positions tab.
- Clicking the checkbox toggles `is_active` for that position via a Supabase update.
- Active positions show a filled checkbox; inactive ones show an empty one.
- The grid layout changes from `grid-cols-[1fr_1fr_auto]` to `grid-cols-[auto_1fr_1fr_auto]` to accommodate the checkbox column.

### 3. Contract Wizard - Dynamic Positions (`ContractDetailsStep.tsx`)
- Remove the hardcoded `JOB_TYPES` constant (lines 67-108).
- Add a `useQuery` hook to fetch positions from the database where `is_active = true`, ordered by `type_number` and `sort_order`.
- Group the fetched positions by `type_number` / `type_label_en` / `type_label_sv` to replicate the current grouped dropdown structure.
- The `Select` dropdown for "Job Type and Salary Group" will render these dynamic groups instead of the static array.

## Technical Details

### Files to modify:
1. **Database**: New migration adding `is_active` column to `positions`
2. **`src/components/dashboard/ContractDataRegistryView.tsx`**: Add checkbox column in the `PositionsTab` component (around lines 106-158)
3. **`src/components/dashboard/ContractDetailsStep.tsx`**: Replace hardcoded `JOB_TYPES` with a database query filtered by `is_active = true`

### Behavior:
- New positions default to active (`is_active = true`)
- Toggling a position off removes it from the contract wizard dropdown immediately
- No data is deleted -- inactive positions remain in the database for historical contracts
- The checkbox toggle uses an optimistic update pattern for instant UI feedback

