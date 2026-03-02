

## Plan: In-App Issue Reporter with Admin Tracker

### Overview
A professional bug reporting system with a floating action button on all screens, auto-screenshot capture, file upload support, and a dedicated admin view to triage and resolve reported issues. Email notifications alert Super Admins of new reports.

### Database

**New table: `issue_reports`**
- `id` uuid PK
- `reporter_id` uuid (user who reported)
- `reporter_email` text
- `org_id` uuid NOT NULL
- `title` text NOT NULL
- `description` text NOT NULL
- `screenshot_url` text (auto-captured)
- `attachment_urls` jsonb DEFAULT '[]' (additional uploads)
- `current_page` text (URL/route where reported)
- `browser_info` text (user agent)
- `status` text DEFAULT 'open' (open / in_progress / resolved / closed)
- `priority` text DEFAULT 'medium' (low / medium / high / critical)
- `admin_notes` text
- `resolved_by` uuid
- `resolved_at` timestamptz
- `created_at` timestamptz DEFAULT now()
- `updated_at` timestamptz DEFAULT now()

RLS: reporters can INSERT and SELECT own reports; admins/HR can SELECT all org reports; only admins can UPDATE (triage/resolve).

**Storage bucket: `issue-screenshots`** (public, for screenshot images)

### New Components

1. **`src/components/dashboard/IssueReportButton.tsx`** -- Floating action button (bottom-right corner, bug icon). Rendered in `Dashboard.tsx` and `AppLauncher.tsx`. Opens the report dialog.

2. **`src/components/dashboard/IssueReportDialog.tsx`** -- Modal with:
   - Auto-captured screenshot of current page (using `html2canvas` or the simpler approach of capturing via canvas -- we'll use the browser's native screenshot capability via `html2canvas`)
   - Title + description fields
   - Optional additional file upload (images)
   - Current page/route auto-filled
   - Browser info auto-filled
   - Submit button

3. **`src/components/dashboard/IssueTrackerView.tsx`** -- Admin-only view accessible from sidebar. EnhancedTable showing all reported issues with filters (status, priority, reporter), detail dialog to view screenshot/description, and actions to change status, add admin notes, set priority.

### Sidebar & Navigation

- Add `issue-tracker` to sidebar registry for `hr-management` and `user-management` apps
- Add routing in `Dashboard.tsx` renderView switch
- Add to default sidebar access for admin roles

### Email Notification

- New edge function `send-issue-notification` that emails super admins when a new issue is reported
- Uses existing Resend integration via `mail.erptable.com`

### Package Addition

- `html2canvas` for auto-screenshot capture

### Files to Create/Edit

| File | Action |
|------|--------|
| DB migration | Create `issue_reports` table + `issue-screenshots` bucket |
| `src/components/dashboard/IssueReportButton.tsx` | Create -- FAB component |
| `src/components/dashboard/IssueReportDialog.tsx` | Create -- report form dialog |
| `src/components/dashboard/IssueTrackerView.tsx` | Create -- admin tracker view |
| `src/components/dashboard/Dashboard.tsx` | Edit -- add FAB + route |
| `src/components/dashboard/AppLauncher.tsx` | Edit -- add FAB |
| `src/lib/sidebar-registry.ts` | Edit -- add issue-tracker item |
| `supabase/functions/send-issue-notification/index.ts` | Create -- email edge function |
| `supabase/config.toml` | Add function config |

