

## Plan: Sidebar Bottom Cleanup + User Profile Panel + i18n Foundation

### Summary of Changes

1. **Hide Screen Size picker on published environments** -- use the existing `isPublishedEnvironment()` check to conditionally hide the screen size picker in the sidebar footer.

2. **Remove Version Badge from sidebar** -- the version is already shown via `TopVersionBadge` in the main content area. Remove the `VersionBadge` rendering from the sidebar bottom.

3. **Make "All Apps" button more prominent** -- increase padding, font size, and add a subtle background so it stands out as a clear navigation action.

4. **User Profile Panel (clicking the chevron on user card)** -- when the user clicks the `ChevronRight` button on the `UserProfileCard`, open a `Dialog` or `Sheet` with:
   - **Avatar upload**: Upload/change profile picture (store in `signatures` bucket under `avatars/{user_id}.png`, save URL to `profiles.avatar_url` column -- requires a migration to add the column).
   - **Change password**: Form with current password validation + new password + confirm (only shown for non-Google users, using `supabase.auth.updateUser({ password })`).
   - **Preferred language selector**: Dropdown to choose between English, Swedish, Romanian. Stored in `profiles.preferred_language` column (requires migration). This will be the foundation for sidebar/page i18n.

5. **Database migration** -- add two columns to `profiles`:
   - `avatar_url text` (nullable)
   - `preferred_language text default 'en'` (nullable)

6. **i18n foundation for Swedish and Romanian** -- create a `src/lib/ui-translations.ts` file with a dictionary for sidebar labels, group headers, and common page titles in EN/SV/RO. Create a React context or hook (`useUiLanguage`) that reads the user's `preferred_language` from their profile and exposes a `t(key)` function. Apply translations to sidebar group labels ("Main", "Settings", "Others") and menu item labels as a first pass.

### Technical Details

**Files to create:**
- `src/lib/ui-translations.ts` -- translation dictionary for UI strings (sidebar labels, common buttons, page headers) in EN, SV, RO
- `src/hooks/useUiLanguage.ts` -- hook that reads `preferred_language` from profile and returns `t(key)` helper

**Files to modify:**
- `src/components/dashboard/Sidebar.tsx`:
  - Remove `VersionBadge` rendering (lines 1011-1014)
  - Conditionally hide Screen Size picker using `isPublishedEnvironment()` (lines 943-982)
  - Make "All Apps" button larger/more prominent (lines 984-1009)
  - Update `UserProfileCard` to open a profile settings dialog on click
  - Apply `t()` translations to group labels and menu item labels
- `src/components/dashboard/AppLauncher.tsx` -- export `isPublishedEnvironment` so Sidebar can import it

**Database migration:**
```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';
```

**Implementation order:**
1. Database migration (add columns)
2. Create translation dictionary + hook
3. Sidebar cleanup (remove version, hide screen picker on prod, enlarge All Apps)
4. Build User Profile Dialog (avatar upload, password change, language selector)
5. Wire translations into sidebar labels

