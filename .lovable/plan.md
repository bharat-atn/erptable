

## Plan: Show Announcement 3 Times Before Permanent Dismissal

### Approach
Instead of storing the announcement ID in `dismissed_announcements` on first dismiss, track a **view count**. Change the storage format from an array of IDs to an array of objects like `{ id: "issue-reporter-v1", count: 2 }`. On the 3rd "Got it" click, the announcement is considered fully dismissed.

### Changes

**`src/components/dashboard/FeatureAnnouncementDialog.tsx`**
- On dismiss: read current `dismissed_announcements`, find the entry for this announcement ID, increment its count. If count reaches 3, mark as fully dismissed. Otherwise just save the incremented count.
- Storage format: `[{ id: "issue-reporter-v1", count: 1 }]` → count increments each login until it hits 3.

**`src/pages/Index.tsx`**
- Update the announcement check logic: instead of checking `dismissed.includes(ANNOUNCEMENT_ID)`, look for an entry with `id === ANNOUNCEMENT_ID` and `count >= 3`. If count < 3 (or no entry), show the dialog.

### No database changes needed
The `dismissed_announcements` column is already `jsonb` — we just change the data shape from a string array to an object array.

