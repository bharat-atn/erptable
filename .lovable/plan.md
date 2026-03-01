

## Plan: Enhance Audit Log Filtering

### Current State
The audit log has three filters: a text search, a category (table) dropdown, and an action dropdown. There is no way to filter by specific user or by date range.

### Changes

**`src/components/dashboard/AuditLogView.tsx`** — Add two new filter controls and wire them into the query/filtering logic:

1. **User filter dropdown** — Extract unique `user_email` values from the fetched logs and populate a `Select` dropdown. Filter client-side (since all emails come from the 500-row fetch). Options: "All Users" + each distinct email found.

2. **Date range filter** — Add "From" and "To" date inputs (`<Input type="date" />`). Apply these as server-side filters on `created_at` using `.gte()` and `.lte()` in the query, so the 500-row limit is scoped to the selected date range.

3. **Clear filters button** — A small button to reset all filters at once.

### Filter Layout
The filter bar will wrap to two rows on smaller screens:
- Row 1: Search input, Category dropdown, Action dropdown
- Row 2: User dropdown, Date From, Date To, Clear button

### Implementation Details
- Add `userFilter` state (default `"all"`)
- Add `dateFrom` and `dateTo` state (default `""`)
- Include `dateFrom`/`dateTo` in the `useQuery` key and apply `.gte("created_at", ...)` / `.lte("created_at", ...)` server-side
- Apply `userFilter` client-side in `filteredLogs`
- Derive unique users from `logs` via `useMemo`
- Import `CalendarDays` icon from lucide-react for the date inputs

No database changes required.

