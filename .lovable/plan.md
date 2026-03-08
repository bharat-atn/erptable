

## Plan: User CSV Import with Data Washing

### Context
The User Management view currently only supports inviting users one-by-one. You want to bulk-import users from CSV with the ability to review, filter, translate, and clean data before committing.

### What We'll Build

**New component: `src/components/dashboard/UserCsvImportDialog.tsx`**

A multi-step import dialog with data washing capabilities:

**Step 1 — Upload & Parse**
- Drag-and-drop or file picker for CSV
- Download template button with columns: `email, full_name, role, org_access, app_access`
- Role values: `admin`, `org_admin`, `hr_manager`, `team_leader`, `user`

**Step 2 — Data Washing (the key differentiator)**
- Full preview table of all parsed rows with validation status per row
- **Row-level filtering**: Checkboxes to include/exclude individual rows or filter by status (valid/invalid/duplicates)
- **Duplicate detection**: Flag emails that already exist in `profiles` or `pending_role_assignments`
- **Role translation**: Dropdown per row to override/correct the role assignment
- **Bulk actions toolbar**: "Select all valid", "Deselect duplicates", "Set role for selected"
- **Inline editing**: Click a cell to correct name or email before import
- **Summary bar**: Shows "X of Y rows selected for import, Z errors, W duplicates"

**Step 3 — Organization & App Assignment**
- Before committing, choose which organization(s) and app access to assign to ALL imported users (same UI as current InviteUserDialog org/app pickers)
- Option to override per-row if the CSV includes `org_access` column

**Step 4 — Confirmation & Import**
- Final summary of what will be created
- Import uses the existing `invite-user` edge function in a batch loop
- Progress bar showing import status
- Results summary with success/failure counts

### CSV Template Columns
```text
email,full_name,role
user@company.com,John Doe,user
admin@company.com,Jane Smith,org_admin
```

### Integration Point
- Add an "Import CSV" button next to the existing "Invite User" button in `UserManagementView.tsx`
- On success, invalidate the `admin-profiles` and `pending-role-assignments` queries

### Files to Create/Edit
1. **Create** `src/components/dashboard/UserCsvImportDialog.tsx` — the full multi-step import dialog with data washing
2. **Edit** `src/components/dashboard/UserManagementView.tsx` — add Import CSV button and wire up the dialog

### Technical Notes
- Duplicate detection queries `profiles` (by email) and `pending_role_assignments` (by email) before showing the preview
- Each row is imported via the existing `invite-user` edge function to ensure consistent role assignment, org membership, and notification logic
- Invalid emails are flagged with regex validation; empty required fields are highlighted in red

