

## Why "Data Handling" is not visible

The sidebar item exists in the code (Sidebar.tsx line 119, sidebar-registry.ts). However, the sidebar loads permissions from the `role_sidebar_access` database table. Since that table was populated **before** the `data-handling` item was added, it has no entry for this menu item — and because there ARE other entries for your role/app combo, the fallback to defaults doesn't kick in.

## Fix

**Option A (recommended)**: Use the "Reset to Defaults" button in **User Management → Role Permissions → Sidebar Permissions tab**. This will re-seed all sidebar permissions from the registry, including the new `data-handling` item.

**Option B (code fix)**: Add a database migration that inserts the missing `data-handling` entry into `role_sidebar_access` for the relevant roles (`admin`, `org_admin`, `hr_manager`) and `app_id = 'hr-management'`.

```sql
INSERT INTO role_sidebar_access (role, app_id, menu_item_id)
VALUES 
  ('admin', 'hr-management', 'data-handling'),
  ('org_admin', 'hr-management', 'data-handling'),
  ('hr_manager', 'hr-management', 'data-handling')
ON CONFLICT DO NOTHING;
```

I'd recommend going with **Option B** (migration) so it's automatic for all users, plus doing the Reset to Defaults from the UI for your current session.

