

## Problem
The Contract Data Registry only stores English and Swedish labels for positions and skill groups. The user needs Romanian, Thai, and Ukrainian translations for all registry data, and the registry UI itself should support these languages.

## Database Changes
Add new columns to two tables:

**`positions` table** — add `label_ro`, `label_th`, `label_uk`, `type_label_ro`, `type_label_th`, `type_label_uk` (all `text NOT NULL DEFAULT ''`)

**`skill_groups` table** — add `label_ro`, `label_th`, `label_uk` (all `text NOT NULL DEFAULT ''`)

## Code Changes

**`src/components/dashboard/ContractDataRegistryView.tsx`**:

1. **PositionsTab**: Expand the add/edit forms to include Romanian, Thai, and Ukrainian label inputs alongside English and Swedish. Update the grid layout to show all 5 language columns. Update insert/update mutations to include the new fields.

2. **SkillGroupsTab**: Same treatment — add RO, TH, UK input fields for add/edit, expand the table grid to display all languages.

3. **SalariesPeriodsTab**: Update the agreement lookup table and CSV export to include the additional language labels from the joined positions/skill_groups data.

4. **BackupRestoreTab**: Include the new columns in the CSV export headers and data rows.

**`src/integrations/supabase/types.ts`**: Will auto-update after migration.

## Technical Notes
- Ukrainian language code: `uk` (ISO 639-1)
- All new columns default to empty string so existing data won't break
- The positions table grid will be wider; we may use a compact layout or horizontal scroll for the 5-language display
- The "Add New Item" cards will stack language inputs in a 2- or 3-column grid

