

## Plan: Complete Issue Lifecycle with Comments and Reporter Feedback

### Problem
Today the issue system is one-directional: users report issues, admins can change status/priority and write internal notes, but there is no way to communicate back to the reporter or have a conversation thread on an issue. The reporter has no visibility into what happened after they submitted.

### Solution

Add a **comments/thread system** on each issue, plus an **audit trigger** for issue_reports, and a **"My Issues" view** so reporters can see their own issues and any responses.

### Database Changes

**1. New table: `issue_comments`**
- `id` (uuid, PK)
- `issue_id` (uuid, FK to issue_reports)
- `org_id` (uuid)
- `author_id` (uuid)
- `author_email` (text)
- `body` (text, max 2000 chars)
- `is_internal` (boolean, default false) -- internal notes vs visible to reporter
- `created_at` (timestamptz)

RLS policies:
- Admins/HR can insert, select all comments for their org
- Users can select non-internal comments on their own issues
- Users can insert comments on their own issues (always non-internal)

**2. Audit trigger on `issue_reports`**
```sql
CREATE TRIGGER audit_issue_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.issue_reports
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
```

### Frontend Changes

**3. `IssueTrackerView.tsx` -- Admin detail dialog**
- Add a **Comments tab** below the admin controls in the detail dialog
- Show threaded comments with author, timestamp, and an "internal" badge for internal notes
- Add a text input with a toggle for "Internal only" to post new comments
- When an admin posts a non-internal comment, optionally send an email notification to the reporter via a new edge function

**4. New component: `IssueCommentsThread.tsx`**
- Reusable comment thread component
- Fetches comments for a given issue_id
- Displays comments in chronological order with author avatars/emails
- Input field for new comments
- "Internal" toggle visible only to admins

**5. Reporter's "My Issues" view**
- Add a small section or dialog accessible from the issue report button area (or a sidebar entry for standard users)
- Shows the reporter's own submitted issues with status badges
- Clicking an issue shows the non-internal comment thread so they can see admin responses and reply

**6. Email notification on admin response (optional edge function)**
- `send-issue-response` edge function
- Sends an email to the reporter when an admin posts a non-internal comment
- Uses the existing Resend integration

### Technical Details

```text
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ User reports  │──────▶│  issue_reports    │◀──────│  Admin triages   │
│ via FAB       │       │  (existing)       │       │  IssueTracker    │
└──────────────┘       └────────┬─────────┘       └──────────────────┘
                                │
                       ┌────────▼─────────┐
                       │ issue_comments    │ ◀── Both sides can
                       │ (NEW)             │     post & read
                       └──────────────────┘
                                │
                       ┌────────▼─────────┐
                       │ Email notify      │
                       │ reporter on reply │
                       └──────────────────┘
```

| File | Change |
|------|--------|
| Database migration | Create `issue_comments` table with RLS; add audit trigger on `issue_reports` |
| `src/components/dashboard/IssueCommentsThread.tsx` | New reusable comment thread component |
| `src/components/dashboard/IssueTrackerView.tsx` | Integrate comment thread into detail dialog |
| `src/components/dashboard/IssueReportDialog.tsx` | Add "My Issues" link/button so reporters can view their submissions and replies |
| `src/components/dashboard/MyIssuesDialog.tsx` | New component: reporter's view of own issues with comment thread |
| `supabase/functions/send-issue-response/index.ts` | New edge function to email reporter when admin replies |

