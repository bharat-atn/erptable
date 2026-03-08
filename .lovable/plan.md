

## Plan: Compensation Group View for Forestry Project Manager

### What We're Building
A full "Compensation Group" management interface matching the screenshot. Each group (e.g., "Comp. group clearing hourly salary") contains SLA classes (101-113) with star-based hourly rates (1-5 stars), client assignments, type selections, and hourly gross values.

### Database

**Table: `comp_groups`**
- `id`, `org_id`, `name` (text), `category` (clearing/planting), `method` (hourly/piecework), `sort_order`, `created_at`, `updated_at`
- RLS: org member current

**Table: `comp_group_classes`**
- `id`, `org_id`, `group_id` (FK to comp_groups), `sla_class_id` (text, e.g. "104"), `type_label` (text), `client` (text), `star_1` (numeric), `star_2`, `star_3`, `star_4`, `star_5`, `hourly_gross` (numeric), `sort_order`, `created_at`, `updated_at`
- RLS: org member current

**Table: `comp_group_types`**
- `id`, `org_id`, `group_id` (FK), `label` (text), `sort_order`
- For the "Manage Types" feature (e.g., "Clearing Type 1 (Hourly Salary)")
- RLS: org member current

### UI Component: `CompGroupView.tsx`

**Top section — Group tabs:**
- Horizontal pill/chip selector for groups with edit/delete icons
- Toolbar: "Manage Types", "Lock Cells", "Compare Groups", "+ New Group", "Duplicate Group"
- Active group highlighted with checkmark

**Filter bar:**
- "Type for 101-113" dropdown, "Show classes" dropdown (default 7), "Client for All" dropdown
- "Reset to Defaults" button, search input
- "Export CSV" and "Import CSV" buttons, "+ Add Class" button

**Table:**
- Columns: checkbox, SLA Class ID, Type (dropdown), Client, Star 1-5 (editable numeric), Hourly Gross (editable), Actions (delete)
- Inline editing for star rates and gross values
- Row highlighting for key classes (e.g., SLA 107)

**CRUD operations:**
- Create/rename/delete/duplicate groups
- Add/edit/delete SLA classes within a group
- Inline cell editing with auto-save
- CSV export/import for class data

### Routing
- Wire `comp-groups` case in `Dashboard.tsx` to render `<CompGroupView />`
- Already registered in sidebar registry

### Files
- **New:** `src/components/dashboard/CompGroupView.tsx`
- **New:** Migration SQL for 3 tables + RLS + audit triggers
- **Edit:** `src/components/dashboard/Dashboard.tsx` — import and route

### Seed Data
On first load for an org, auto-create the 4 default groups and seed 7 default SLA classes (104-110) with the star rating values shown in the screenshot.

