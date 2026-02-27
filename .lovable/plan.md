

## Problem

The "Click here to update" button uses `window.location.reload()` which causes a full browser-level page reload — the entire page goes white/blank momentarily, feeling like the app is "closing down." This is jarring for users.

## Solution

Replace the hard `window.location.reload()` with a softer in-app refresh approach:

1. **Invalidate all React Query caches** — clears stale data so fresh data is fetched
2. **Reset the version tracking state** — so the banner disappears and the new version becomes the baseline
3. **Use React Router's navigation** to re-mount the current view without a full browser reload

This keeps the app shell (sidebar, layout) intact and just refreshes the content, feeling like a seamless update rather than a shutdown.

## Changes

**`src/components/dashboard/VersionUpdateBanner.tsx`**:
- Accept a new prop `onVersionUpdate` callback
- Replace `window.location.reload()` with: reset `initialVersion` to the new version, dismiss banner, and call `onVersionUpdate()`

**`src/components/dashboard/Dashboard.tsx`**:
- Import `useQueryClient` from `@tanstack/react-query`
- Pass an `onVersionUpdate` handler to `VersionUpdateBanner` that calls `queryClient.invalidateQueries()` to refresh all cached data

This way clicking "update" will refresh all data queries and dismiss the banner without the browser-level page teardown.

