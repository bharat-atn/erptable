

## Sidebar Header App Switcher

### What changes
The top section of the sidebar (currently showing "OnboardFlow / HR Management") will become a dynamic app switcher that:

1. Displays the **currently active application's name, subtitle, and icon** (matching what's shown in the App Launcher cards)
2. Clicking the header opens a **dropdown popover** listing all enabled applications from the App Launcher
3. Selecting a different app from the dropdown switches to that application (or shows "Coming Soon" for unavailable apps)
4. The "Back to All Apps" button in the dropdown provides quick access to the full App Launcher

### How it will look
- **Expanded sidebar**: Shows the app icon (colored, matching the launcher card), the app name (e.g., "HR Management System"), and a chevron dropdown indicator. Clicking opens a popover with all available apps.
- **Collapsed sidebar**: Shows just the app icon. Clicking opens the same popover to switch apps.

### Technical Details

**Files to modify:**

1. **`src/components/dashboard/Sidebar.tsx`**
   - Update `SidebarProps` to receive the current `appId` and the list of `AppDefinition[]` from the launcher
   - Replace the static `SidebarHeader` component with a new `AppSwitcherHeader` that:
     - Reads the current app's icon, name, and color from the apps list
     - Uses a Radix `Popover` to show a dropdown of all enabled apps
     - Calls `onSwitchApp(appId)` when a different app is selected
     - Shows a "Coming Soon" toast for unavailable apps

2. **`src/components/dashboard/Dashboard.tsx`**
   - Pass `appId` and `apps` list down to `Sidebar`
   - Add an `onSwitchApp` callback that changes the active app (via the parent)

3. **`src/pages/Index.tsx`**
   - Pass the `activeApp` id and a shared `apps` list to `Dashboard`
   - Handle app switching from Dashboard level (same as launcher's `onLaunchApp`)

4. **`src/components/dashboard/AppLauncher.tsx`**
   - Export `loadApps`, `getIcon`, `getColor`, and `COLOR_OPTIONS` so the Sidebar can reuse them without duplicating the app definitions

