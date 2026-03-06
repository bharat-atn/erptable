

## Plan: Fix Empty Sidebar for Forestry Project Manager

### Problem
The sidebar is empty because the `filterByPermission` function queries the `role_sidebar_access` database table. When no rows exist for the `forestry-project` app (they were never seeded), the query returns an empty result set, which becomes an empty `Set`. This causes all menu items to be filtered out.

The `placeholderData` fallback to `DEFAULT_SIDEBAR_ACCESS` only works while the query is **loading**. Once the query resolves with 0 rows, the empty Set takes over.

### Fix

**`src/components/dashboard/Sidebar.tsx`** — Update `filterByPermission` (around line 967-970):

When `allowedItems` is a Set with size 0 **and** there are default permissions available in `DEFAULT_SIDEBAR_ACCESS`, fall back to the defaults instead of showing nothing. This ensures the sidebar always shows items even before permissions are explicitly configured in the database.

Change the logic from:
```ts
if (!allowedItems) return [];
return items.filter(item => allowedItems.has(item.id));
```

To:
```ts
if (!allowedItems) return [];
if (allowedItems.size === 0 && userRole && appId) {
  const defaults = DEFAULT_SIDEBAR_ACCESS[appId]?.[userRole];
  if (defaults) {
    const defaultSet = new Set(defaults);
    return items.filter(item => defaultSet.has(item.id));
  }
}
return items.filter(item => allowedItems.has(item.id));
```

This is a single, small change that fixes the empty sidebar for the forestry app (and any future app) without requiring a database migration to seed permission rows.

