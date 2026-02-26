

## Plan: Make User Management a Standalone App

### Current State
- "User Management" appears as a sidebar item in the "Others" group inside every app (for admins)
- When the "User Management" app is launched from the App Launcher, it shares the same generic sidebar as HR Management, showing irrelevant items like "Contract Template", "Invitations", etc.

### Changes

**1. Remove "User Management" from the shared sidebar (`Sidebar.tsx`)**
- Remove the code at lines 681-684 that injects "user-management" into `configItems` for admins
- User Management will only be accessible via its dedicated app in the App Launcher

**2. Add a dedicated sidebar for the User Management app (`Sidebar.tsx`)**
- When `appId === "user-management"`, render a simplified sidebar with only User Management-relevant items:
  - **Users** (the main user list/table)
  - **Audit Log** (track user changes)
  - **Settings** (org settings, default signature)
- This keeps the User Management app focused as a dedicated hub

**3. Update `Dashboard.tsx` to default to the user management view**
- When `appId === "user-management"`, set the initial `activeView` to `"user-management"` instead of `"dashboard"`

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/Sidebar.tsx` | Remove user-management injection into configItems; render dedicated nav when `appId === "user-management"` |
| `src/components/dashboard/Dashboard.tsx` | Set default view to `"user-management"` when appId is `"user-management"` |

