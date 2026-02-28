

## Plan: Dual Organization Setup + Org Membership Management in User Management

### Current State
- One organization exists: "Ljungan Skogsvård AB" (production, id: `9bf5a0b6-...`)
- 6 members are assigned to it
- User Management has no org membership controls

### Step 1: Create Sandbox Organization (Data Insert)
Insert a second organization cloned from the existing one:
- Name: "Ljungan Skogsvård AB" with `org_type: sandbox`, slug: `ljungan-sandbox`
- Same `created_by` as the original
- Add all 6 current members to the new sandbox org with same roles

### Step 2: Add Org Membership Tab to User Management
Add an "Organizations" column or section in `UserManagementView.tsx` that shows which organizations each user belongs to, with controls to:
- View org memberships per user (badges showing org name + type)
- Add a user to an organization (dialog with org selector + role picker)
- Remove a user from an organization

This requires:
- Fetching `org_members` joined with `organizations` in the user management queries
- A new "Manage Orgs" action per user row
- A dialog to add/remove org memberships

### Step 3: Update OrganizationPicker Display
The existing org now shows as "Ljungan Skogsvård AB" for both. We need to differentiate them visually — the picker already renders `Production` / `Sandbox` badges from `org_type`, so this works automatically.

### Files Changed
1. **Database insert** — Create sandbox org + clone member assignments
2. **`src/components/dashboard/UserManagementView.tsx`** — Add org membership column and management dialog
3. **`src/components/dashboard/OrganizationPicker.tsx`** — No changes needed (already shows org_type badges)

### Architecture Note
Infrastructure (menus, translations, sidebar registry, app launcher config) is shared code — identical across all orgs. Only data tables (employees, contracts, companies, invitations, etc.) are org-scoped via RLS with `org_id`. This is already the architecture in place.

