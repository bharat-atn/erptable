

## Plan: Clean Up User Management & Smart App Access in Invite Dialog

### Changes

| File | Change |
|---|---|
| `src/components/dashboard/UserManagementView.tsx` | **1.** Remove the "Apps" column (key `appCount`) from the columns array and the `AppAccessDialog` component + related state. **2.** Add subtle color to role icons in `roleBadge` — e.g., Shield in indigo, UserCheck in blue, Briefcase in amber, Wallet in emerald, Users in purple. **3.** In `InviteUserDialog`, fetch `role_app_access` for the selected role and auto-set `selectedApps` whenever the role dropdown changes. This way selecting "Standard User" only checks Employee Hub, selecting "Team Leader" checks Employee Hub + Time Reporting, etc. |

### Role Icon Colors

```text
Super Admin  → Shield      → indigo-600
Admin        → ShieldCheck → blue-600
HR Manager   → UserCheck   → sky-500
Project Mgr  → Briefcase   → amber-600
Payroll Mgr  → Wallet      → emerald-600
Team Leader  → Users       → purple-500
Standard     → User        → gray-400
No Role      → CircleDot   → gray-400
```

### Invite Dialog: Role-Driven App Access

When the admin changes the role dropdown, we query `role_app_access` for that role and pre-check exactly those apps. The admin can still manually override by toggling checkboxes before sending the invite. On initial load the default role is "user", so only Employee Hub will be checked.

### Regarding Emails

The system already sends a role notification email via the `send-role-notification` Edge Function when a role is assigned. The invite flow creates the user and assigns their role in a single step via the `invite-user` Edge Function, so the user receives the notification. No additional email work is needed.

