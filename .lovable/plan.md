

## Plan: Improve Screenshot Quality + Issue Status Changelog System

Three areas of work:

### 1. Fix dark screenshot capture
**File: `src/components/dashboard/IssueReportDialog.tsx`**
- Increase `html2canvas` scale from `0.5` to `1.0` for better quality
- Add `backgroundColor: "#ffffff"` to force a white background instead of transparent/dark
- Add `windowWidth` and `windowHeight` options to capture full viewport

### 2. New database table: `issue_updates` (changelog entries)
A new table to track resolution progress visible to users:

```sql
CREATE TABLE public.issue_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  issue_id uuid REFERENCES issue_reports(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  update_type text NOT NULL DEFAULT 'info' CHECK (update_type IN ('fix', 'improvement', 'info', 'known_issue', 'workaround')),
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'public')),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.issue_updates ENABLE ROW LEVEL SECURITY;
-- RLS: authenticated users in the org can read public updates; admins/hr can read all and write
```

### 3. New component: `IssueChangelogView.tsx`
A CRUD admin view (accessible from the Issue Tracker or as a tab) where super admins can:
- **Create** changelog entries (title, description, type: fix/improvement/known issue/workaround, linked issue, visibility: internal/public)
- **Read** all entries in a table with filters by type
- **Update** existing entries via edit dialog
- **Delete** entries with confirmation dialog
- Each entry can optionally link to an `issue_reports` row

### 4. Add to Issue Tracker as a tab
**File: `src/components/dashboard/IssueTrackerView.tsx`**
- Add a `Tabs` component with two tabs: "Issues" (existing table) and "Changelog" (new view)
- The changelog tab shows the `IssueChangelogView`

### 5. Sidebar registry
No changes needed -- the changelog is embedded within the existing Issue Tracker view.

### Summary of files
| File | Action |
|------|--------|
| `src/components/dashboard/IssueReportDialog.tsx` | Edit html2canvas options |
| New migration | Create `issue_updates` table + RLS |
| `src/components/dashboard/IssueChangelogView.tsx` | New CRUD component |
| `src/components/dashboard/IssueTrackerView.tsx` | Add tabs wrapping issues + changelog |

