

## Plan: Version Management System

### Overview
Build an industrial-strength version management system with a database-backed version history, a management UI in Settings, and a version badge visible in the sidebar. Supports release stages: Alpha, Beta, RC (Release Candidate), and Release.

### Database Changes

**New table: `app_versions`**
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid | gen_random_uuid() | PK |
| version_tag | text | NOT NULL | e.g. `v2026-02-25-001` |
| release_type | text | 'alpha' | One of: alpha, beta, rc, release |
| release_date | date | CURRENT_DATE | |
| release_time_utc | timestamptz | now() | |
| sequence_number | integer | NOT NULL | Daily sequence (#001, #002...) |
| status | text | 'published' | published / draft |
| notes | text | '' | Release notes / changelog |
| created_by | uuid | auth.uid() | User who created it |
| created_at | timestamptz | now() | |

- RLS: HR users can read/insert/update; no deletes.
- Auto-generate `version_tag` as `vYYYY-MM-DD-NNN` where NNN is the daily sequence.

### New Components

**1. `src/components/dashboard/VersionManagementView.tsx`**
- Header: "Version Management" with subtitle instructions and "+ New Release" button
- Card with scrollable table showing all versions (newest first)
- Columns: Version, Type (badge: Alpha=yellow, Beta=blue, RC=orange, Release=green), Release Date, Time (GMT), Time (Local), Sequence, Status (badge), Release Notes (truncated)
- "New Release" dialog:
  - Auto-generated version tag (`vYYYY-MM-DD-NNN`)
  - Type selector dropdown (Alpha, Beta, RC, Release)
  - Notes textarea
  - "Publish" button that inserts into `app_versions`

**2. Version badge in Sidebar**
- Below the user profile or above sign-out, show a small badge with the latest version tag and type
- Clicking it opens a popover/hover-card showing: Version, Status, Released date, Time (GMT), Time (Local), and Release Notes — matching the reference screenshot
- When sidebar is collapsed, show just a small version icon with tooltip

### Integration Points

- **Sidebar**: Add version badge component, fetch latest version via `useQuery`
- **Dashboard routing**: Add `case "version-management"` → `<VersionManagementView />`
- **Sidebar menu**: Add "Version Management" item to the config/settings menu group with a `GitBranch` icon
- **Settings view**: No changes needed — version management gets its own dedicated view accessible from the sidebar

### Technical Details

- Daily sequence auto-calculated: count existing versions for the same date + 1
- Version tag format: `v{YYYY-MM-DD}-{NNN}` (zero-padded 3 digits)
- Release type badges use existing Badge component variants
- All times stored as UTC; local time computed client-side using `Intl.DateTimeFormat`
- Table uses the existing `EnhancedTable` component for consistency

### Files to Create/Edit
- **Create**: `src/components/dashboard/VersionManagementView.tsx`
- **Edit**: `src/components/dashboard/Sidebar.tsx` (add menu item + version badge)
- **Edit**: `src/components/dashboard/Dashboard.tsx` (add routing case)
- **DB Migration**: Create `app_versions` table with RLS policies

