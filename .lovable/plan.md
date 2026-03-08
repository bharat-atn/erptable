

## Plan: 10 Pro Improvements to Data Handling

### 1. Mapping progress bar per section
Add a mini progress indicator next to each section label in the dropdown and a summary bar above the mapping grid showing e.g. "2.1: 3/11 · 2.2: 1/9 · 2.3: 0/3 · 3: 2/4 · 4: 0/1". Gives instant visibility into mapping completeness.

### 2. CSV sample data preview in mapping cards
Currently shows one sample value (`e.g. "..."`). Expand to show 2-3 sample values stacked so users can better judge what a column contains before mapping it. Truncate long values.

### 3. Duplicate field assignment warning
If the same system field is mapped to two different CSV columns, show an inline warning badge on both cards (e.g. "⚠ Also mapped from column X"). Prevents silent data overwrite.

### 4. Unmapped required fields alert
Show a persistent alert banner when required fields (email, and optionally name) are not yet mapped to any CSV column. Currently only the "Continue" button is disabled — make the reason visible.

### 5. Batch row delete in Data Washing (Step 2)
Add a "Delete Selected" button alongside "Select All Valid" and "Deselect Duplicates" that removes checked rows entirely from the dataset, not just deselects them. Useful for cleaning junk/test rows.

### 6. Data Washing: show personalInfo columns
Step 2 table only shows first_name, middle_name, last_name, email, phone, city. Add optional expandable columns for address, bank, emergency data so users can verify all mapped data — not just core fields.

### 7. Export cleaned data as CSV
After Step 2 (washing), add an "Export Cleaned CSV" button that downloads the current validated dataset. Useful for auditing or importing into other systems.

### 8. Undo/redo for inline edits in Step 2
Track an edit history stack so users can undo accidental cell edits with Ctrl+Z or an undo button. Currently edits are immediately committed with no rollback.

### 9. Import dry-run mode
Add a "Test Import" option in Step 4 that validates all rows against the database (checks for duplicates, schema constraints) without actually inserting. Shows a detailed report of what would succeed/fail.

### 10. Download template with all sections labeled
Current template CSV has a flat header row. Improve it to include all system fields grouped with a comment row or separate sheets, and add a second sample row with Swedish-format data (personnummer, Swedish bank, etc.).

---

### Files to edit
- `src/components/dashboard/DataHandlingView.tsx` — all 10 changes are in this single file

### Implementation priority (suggested order)
Items 1-4 are quick wins (UI-only, no backend). Items 5-7 are medium effort. Items 8-10 are larger features.

