

## Plan: One-Time Feature Announcement Banner for Bug Reporter

### Approach
Show a dismissible announcement dialog/banner once per user on their next login, informing them about the new issue reporting feature. Once dismissed, it never shows again (persisted in the `profiles` table).

### Changes

**Database migration**
- Add column `dismissed_announcements jsonb DEFAULT '[]'` to `profiles` table. This stores an array of announcement IDs the user has dismissed, making it reusable for future announcements.

**New component: `src/components/dashboard/FeatureAnnouncementDialog.tsx`**
- A polished dialog that shows on login (after profile dialog, before app launcher/dashboard).
- Announcement ID: `"issue-reporter-v1"`
- Content: icon of the bug button, short explanation that a new reporting tool is available in the bottom-right corner, and a "Got it" button to dismiss.
- On dismiss: updates `profiles.dismissed_announcements` to include this ID, sets session flag so it doesn't re-render.

**Edit: `src/pages/Index.tsx`**
- After the profile dialog check passes, add a new check: query `profiles.dismissed_announcements` and if `"issue-reporter-v1"` is not in the array, show `FeatureAnnouncementDialog` before proceeding to the app launcher.
- Uses `sessionStorage` guard (like the profile dialog) to avoid re-checking within the same session.

### Flow
```text
Login → Profile Dialog (if enabled) → Feature Announcement (if not dismissed) → App Launcher
```

### No other files affected
The announcement system is self-contained and reusable for future feature introductions by simply adding new announcement entries.

