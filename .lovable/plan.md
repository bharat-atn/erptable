

## Plan: Add "Field Type" Column to Invitation Template

### What's changing
A new "Field Type" dropdown column will be added to the far right of each row in the Invitation Template grid. This lets administrators define what input type each field should use on the onboarding form (text, number, date, email, phone, select/dropdown, textarea, checkbox, file upload, url).

### Technical Details

The `field_type` column already exists in the database table `invitation_template_fields`. No database migration is needed — this is a UI-only change.

**File:** `src/components/dashboard/InvitationTemplateView.tsx`

1. **Add a Select import** from `@/components/ui/select`

2. **Define field type options** — approximately 10 standard form input types:
   - `text` — Text
   - `number` — Number
   - `date` — Date
   - `email` — Email
   - `phone` — Phone
   - `select` — Dropdown
   - `textarea` — Text Area
   - `checkbox` — Checkbox
   - `file` — File Upload
   - `url` — URL

3. **Update the grid layout** from 6 columns to 7 columns:
   - Current: `grid-cols-[1fr_1fr_1fr_1fr_80px_80px]`
   - New: `grid-cols-[1fr_1fr_1fr_1fr_80px_80px_120px]`
   - The new "Field Type" column goes on the far right

4. **Add header** for the new column: "Field Type"

5. **Add a `<Select>` dropdown** in each row that:
   - Displays the current `field_type` value
   - On change, calls `updateField(rawField.id, { field_type: value })`
   - Saves with the existing "Save Changes" button (same dirty-tracking mechanism)

