

## Sidebar Visibility Permissions per Role per App

### Problem
Currently, all sidebar menu items are visible to every user regardless of role. The user needs a system where admins can configure which sidebar items each role can see, per application.

### Design

**New database table: `role_sidebar_access`**
- `id` (uuid, PK)
- `role` (text, NOT NULL) — the role value (admin, org_admin, hr_manager, etc.)
- `app_id` (text, NOT NULL) — which app this applies to (hr-management, etc.)
- `menu_item_id` (text, NOT NULL) — the sidebar item id (dashboard, operations, contracts, etc.)
- `created_at` (timestamptz)
- Unique constraint on (role, app_id, menu_item_id)
- RLS: admins can manage, authenticated users can read

**Default seeding:** Super Admin gets all items for all apps. Other roles get a sensible subset.

**New UI: "Sidebar Permissions" tab in Role Permission Matrix**
- Extend the existing Role Permission Matrix with a second tab or section
- For each app, show a matrix: rows = sidebar items (Dashboard, Operations, Invitations, etc.), columns = roles
- Toggle switches to grant/revoke visibility per role per item
- "Reset to Defaults" button

**Sidebar filtering:**
- Sidebar component fetches `role_sidebar_access` for the current user's role + current app
- Filters `menuItems`, `settingsItems`, `configItems` to only show permitted items
- Super Admin always sees everything (hardcoded bypass)

### Implementation Steps

1. **Create `role_sidebar_access` table** with migration — columns: role, app_id, menu_item_id. RLS policies for admin management + authenticated read. Seed with defaults for all roles.

2. **Build Sidebar Permissions UI** — Add a new view (or tab within Role Permission Matrix) showing a matrix per app where admins toggle which sidebar items each role can see. Reuse the existing matrix pattern.

3. **Filter sidebar items by role** — In `Sidebar.tsx`, fetch the user's permitted menu items from `role_sidebar_access` for the current `appId` and `userRole`. Filter `menuItems`, `settingsItems`, and `configItems` accordingly. Super Admin bypasses the filter.

4. **Add sidebar item registry** — Create a constant mapping of all sidebar item IDs with their group (main/settings/others) and app association, so the permission UI knows what items exist for each app.

### Technical Details

```text
role_sidebar_access table:
┌──────────┬────────────────┬──────────────────────┐
│ role     │ app_id         │ menu_item_id         │
├──────────┼────────────────┼──────────────────────┤
│ admin    │ hr-management  │ dashboard            │
│ admin    │ hr-management  │ operations           │
│ admin    │ hr-management  │ invitations          │
│ admin    │ hr-management  │ contracts            │
│ admin    │ hr-management  │ contract-template    │
│ ...      │ ...            │ ...                  │
│ hr_mgr   │ hr-management  │ dashboard            │
│ hr_mgr   │ hr-management  │ operations           │
│ hr_mgr   │ hr-management  │ invitations          │
│ team_ldr │ hr-management  │ dashboard            │
└──────────┴────────────────┴──────────────────────┘
```

The Sidebar component will use a query like:
```sql
SELECT menu_item_id FROM role_sidebar_access 
WHERE role = :userRole AND app_id = :appId
```

Then filter the three item arrays (`menuItems`, `settingsItems`, `configItems`) to only include items present in the result set. Admin role skips this filter entirely.

