

## Plan: Make Version Banner Work in Production with Hard Reset

### Problem
Two issues:
1. The "Click here to update" button currently does a soft React Query cache invalidation — it doesn't actually reload the app to pick up new deployed code. Users in the published environment won't get the new frontend bundle.
2. The banner should work identically in both development and published environments (it already does since it queries the database, but the update action needs to be a real page reload).

### Change

**`src/components/dashboard/VersionUpdateBanner.tsx`**
- Replace `handleUpdate` logic: instead of setting state and calling `onVersionUpdate()`, perform a **hard browser reload** via `window.location.reload()`. This forces the browser to fetch the latest deployed assets.
- Remove the `onVersionUpdate` prop entirely since it's no longer needed.
- Remove the `dismissed` state management from the update button (the reload handles it).

**`src/components/dashboard/Dashboard.tsx`**
- Remove the `onVersionUpdate` prop passed to `VersionUpdateBanner` (no longer exists).

### Result
When a new version is published and detected by the 30-second polling, the banner appears. Clicking "Click here to update" triggers `window.location.reload()` — a hard reset that loads the latest code bundle without closing or disrupting anything beyond a normal page refresh.

