

## Analysis & Answers to Your Questions

**How do pending users appear?** When someone signs in (via Google or email), the `handle_new_user` database trigger automatically creates a profile with `role = 'pending'`. They have no entry in `user_roles`, so they're stuck at the "Pending Approval" screen until an admin assigns them a role. Anyone who visits the sign-in page and authenticates will appear as "Pending."

**Does assigning a role send an email?** No. Currently, assigning a role just updates the database silently. The user would only discover they're approved next time they try to log in. We can add email notification as a future feature.

**Is "Last Active" working?** No. The `last_sign_in_at` column in profiles is never updated after the initial signup. The `handle_new_user` trigger only fires on user creation, not on subsequent sign-ins. This needs a fix.

---

## Plan: Improve User Management UX & Fix Issues

### 1. Redesign Role & Status Badges (subtle, no loud colors)

Replace the current colorful badges with a more refined approach:
- **Roles**: Use subtle, monochrome icon-based labels instead of colored badges. For example, a small shield icon + "Super Admin" in regular text weight, no background color. Differentiate with icon variants only.
- **Status**: Replace colored badges with a simple dot indicator (small 6px circle) — green dot for Approved, amber dot for Pending — next to plain text. No background fills.

### 2. Fix "Last Active" Tracking

Create a database trigger on `auth.users` — wait, we cannot attach triggers to `auth` schema. Instead:
- Add an `onAuthStateChange` listener in the app that updates `profiles.last_sign_in_at` whenever a user signs in (fires on `SIGNED_IN` event). This is a client-side approach in `App.tsx` or the auth flow.

### 3. Add Ability to Edit User Names

- Add an "Edit" action to each user row (pencil icon) that opens a small dialog to update `full_name` on the `profiles` table.
- This lets the admin correct names that came from Google metadata or were set incorrectly.

### 4. Summary of Visual Changes

Current role badge rendering will be replaced with clean, minimal text + icon approach:

```text
Current:        [🔴 Super Admin]  [🟢 HR Admin]  [🔵 HR Staff]
Proposed:       🛡 Super Admin    👤 HR Admin     👤 HR Staff    👤 User    ○ No Role
```

Status will use inline dots instead of colored badge backgrounds.

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/UserManagementView.tsx` | Redesign `roleBadge()` to use subtle icons+text; redesign status column to use dot+text; add edit name dialog; add edit action to row actions |
| `src/App.tsx` | Add `onAuthStateChange` listener that updates `profiles.last_sign_in_at` on `SIGNED_IN` events |

