

## Enterprise Organization Picker Overhaul

The current Organization Picker is a bare skeleton: no branding, no sign-out, no user identity, no way to switch accounts. Here's the plan to make it enterprise-grade.

### Changes to OrganizationPicker.tsx

1. **Header with branding** -- Add the ERP Table logo (`src/assets/erp-table-logo.png`) at the top, consistent with the login screen
2. **Signed-in user strip** -- Show the current user's email/name with avatar, so users know which account they're in
3. **Sign Out button** -- Prominent button to sign out and return to login (mirrors the AppLauncher's sign-out behavior with audit logging)
4. **"Switch Account" link** -- Secondary action below sign-out for users who need a different Google account
5. **Empty state improvement** -- When no orgs exist and user is not admin, show a clear "No organizations available -- contact your administrator" message instead of a blank page
6. **Footer** -- "Secure Enterprise Login" footer matching the AuthForm
7. **Visual polish** -- Match the AuthForm's card styling (shadow, backdrop blur, ring) and the AppLauncher's spacing

### Changes to Index.tsx

8. **Pass user email to OrganizationPicker** -- So it can display the signed-in identity
9. **Clear org on sign-out** -- Ensure `sessionStorage` org is cleared when session ends (already handled by OrgContext but verify)

### Changes to OrgContext.tsx

10. **Add `clearOrg` method** -- Exposed function to explicitly clear org selection, enabling a "Switch Organization" button from the AppLauncher/Sidebar without signing out

### Changes to AppLauncher.tsx

11. **Add "Switch Organization" button** -- In the header next to Log Out, allowing users to go back to the org picker

### Summary of navigation flow

```text
Login → Org Picker → App Launcher → Dashboard
  ↑         ↑              ↑
  |    Sign Out        Switch Org
  |    Switch Account  Sign Out
  └────────────────────────────┘
```

All screens have consistent branding (logo), user identity display, and clear escape hatches. No dead ends.

