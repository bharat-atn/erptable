

## Plan: Speed Up Sidebar Loading

### Root Cause

The sidebar hides **all menu items** while the `role_sidebar_access` query is in flight (line 928: `if (!allowedItems) return []`). Combined with React Query's default `staleTime: 0`, this means every time you navigate to the Dashboard the sidebar fires a fresh network request and shows a blank sidebar until it resolves. The Supabase round-trip adds 1-2 seconds, and this stacks on top of the auth/role/org queries that must complete first (waterfall effect).

### Changes

**`src/components/dashboard/Sidebar.tsx`**

1. **Add `staleTime` and `gcTime` to the sidebar access query** — cache the result for 5 minutes so switching between apps or re-rendering the Dashboard does not re-fetch:
   ```typescript
   staleTime: 5 * 60 * 1000,
   gcTime: 10 * 60 * 1000,
   ```

2. **Show a lightweight loading skeleton instead of empty sidebar** — replace the `return []` fallback with a shimmer/skeleton placeholder so the user sees the sidebar structure instantly, even before permissions load. This eliminates the perceived 3-5 second "blank sidebar" delay.

3. **Use `placeholderData` from the sidebar registry defaults** — while the query is loading, use `DEFAULT_SIDEBAR_ACCESS[appId][userRole]` from `sidebar-registry.ts` as immediate placeholder data. This means the sidebar items render instantly with the correct defaults, then silently update if the database has overrides. This is the biggest win: zero visible delay.

### Technical Detail

```typescript
import { DEFAULT_SIDEBAR_ACCESS } from "@/lib/sidebar-registry";

const { data: allowedItems } = useQuery({
  queryKey: ["role-sidebar-access", userRole, appId],
  queryFn: async () => { /* existing logic */ },
  enabled: !!userRole && !!appId,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  placeholderData: () => {
    if (!userRole || !appId) return null;
    const defaults = DEFAULT_SIDEBAR_ACCESS[appId]?.[userRole];
    if (!defaults) return null;
    return new Set(defaults);
  },
});
```

### Result

The sidebar will render instantly using the local defaults from `sidebar-registry.ts`, then silently swap in the database-stored permissions once the query completes. For the majority of users whose permissions match defaults, there will be zero visual change. The perceived load time drops from 3-5 seconds to near-instant.

