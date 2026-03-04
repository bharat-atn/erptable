

## Plan: Fix Update Button Feedback and Sticky Dialog Footer

### Issues Identified

1. **"Update" (Uppdatera) button** — The button calls `invalidateAll()` which silently re-fetches data. There's no visual feedback (no spinner, no toast), so it appears broken even though it's working. Fix: add a brief spinning animation on the refresh icon and a subtle toast confirmation.

2. **Invite User dialog footer scrolls off-screen** — The dialog has `max-h-[90vh] overflow-y-auto` on the entire `DialogContent` (line 408), which means the Cancel and Invite User buttons scroll away with the content on small screens. Fix: restructure so the body content scrolls independently while the footer stays pinned at the bottom.

### Changes

**File: `src/components/dashboard/UserManagementView.tsx`**

| Location | Change |
|----------|--------|
| ~line 1309 `invalidateAll` | Add a `refreshing` state that briefly shows a spinning icon on the Refresh button and shows a toast ("Data refreshed") on completion |
| ~line 1334 Refresh button | Bind the `refreshing` state to animate the `RefreshCw` icon and disable the button during refresh |
| ~line 408 `InviteUserDialog` DialogContent | Remove `overflow-y-auto` from DialogContent; wrap the form body (lines 458-578) in a `div` with `overflow-y-auto flex-1 min-h-0`; move `DialogFooter` outside the scrollable area so it stays pinned |

### Result
- The Refresh button will spin briefly and confirm "Data refreshed" so users know it worked
- The Invite User dialog's Cancel and Invite buttons will always be visible at the bottom, with only the form content scrolling

