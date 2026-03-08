

## Plan: "Data Handling" Sidebar Section with Comprehensive Employee CSV Import

### What the user wants
A dedicated **"Data Handling"** section in the HR Management sidebar that provides a full-page view (not just a dialog) for importing employee data from CSV with:
1. **Name splitting** — CSV has a single "name" column; system needs first/middle/last separated
2. **Field mapping** — Map CSV columns to the employee system fields
3. **Duplicate detection** — Comprehensive duplicate checking against existing employees
4. **Employee ID assignment** — Map/generate employee IDs for each imported person
5. **Data washing** — Filter, clean, translate, and transform data before import

### Architecture

**New sidebar item**: `data-handling` added to HR Management's SETTINGS group in both the sidebar menu and the sidebar registry.

**New view component**: `src/components/dashboard/DataHandlingView.tsx` — a full-page, multi-step data handling workspace (not a small dialog).

### Multi-step workflow

**Step 1 — Upload & Column Mapping**
- Upload CSV file (drag-and-drop or file picker)
- Auto-detect CSV columns and show a mapping UI: for each detected CSV column, pick which employee system field it maps to (first_name, last_name, email, phone, city, country, personal_info sub-fields, etc.)
- Special handling: if a "name" column is detected, offer a **Name Splitter** that auto-splits into first/middle/last using heuristics (last token = last name, first token = first name, rest = middle)

**Step 2 — Data Washing & Validation**
- Full-width table showing all mapped rows
- Row-level checkboxes for selection/deselection
- **Duplicate detection**: check against existing `employees` table by email, name, or phone
- **Inline editing**: click any cell to correct values
- **Name splitting preview**: show how "Lazea Dorin Felician" splits into First: "Lazea", Middle: "Dorin", Last: "Felician" — with the ability to override per row
- **Bulk actions**: Select All Valid, Deselect Duplicates, Set Status for Selected
- **Filter tabs**: All / Valid / Invalid / Duplicate
- **Validation**: email format, required fields, birthday format

**Step 3 — Employee ID Assignment**
- Fetch current `employee_id_settings` (prefix, separator, padding, next_number)
- Show preview of auto-generated IDs (e.g. EPM-001, EPM-002...)
- Option to auto-assign sequential IDs or manually override per row
- Show which employees will get IDs (only ACTIVE status)

**Step 4 — Review & Import**
- Final summary: X employees to create, Y with IDs, Z fields mapped
- Progress bar during import
- Batch insert into `employees` table with `personal_info` JSONB
- Results summary with success/failure counts

### Files to create/edit

1. **Create** `src/components/dashboard/DataHandlingView.tsx` — full-page multi-step import view
2. **Edit** `src/components/dashboard/Sidebar.tsx` — add `data-handling` menu item to defaultSettingsItems
3. **Edit** `src/components/dashboard/Dashboard.tsx` — add case for `data-handling` in renderView
4. **Edit** `src/lib/sidebar-registry.ts` — register `data-handling` in hr-management app items and default access

### Name splitting logic
```text
Input: "Lazea Dorin Felician"
→ Split by spaces
→ If 3+ tokens: first = tokens[0], last = tokens[tokens.length-1], middle = tokens[1..n-1].join(" ")
→ If 2 tokens: first = tokens[0], last = tokens[1], middle = ""
→ If 1 token: first = tokens[0], last = "", middle = ""
→ Each row gets manual override capability
```

### Duplicate detection
- Query existing employees by email (exact match)
- Query by full name (fuzzy: normalize case + trim)
- Flag duplicates with merge/skip options

