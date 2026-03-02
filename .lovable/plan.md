

## Plan: Ensure Audit Log Captures and Displays All System Users

### Problem
The audit log's "User" filter dropdown only shows users who already have entries in the log. Users like Yash Gandhi and Peter Hakala who haven't yet generated audit events are invisible in the filter. This makes the audit log incomplete as a monitoring tool.

### Changes

**`src/components/dashboard/AuditLogView.tsx`**

1. Add a separate query to fetch all user emails from the `profiles` table
2. Replace the `uniqueUsers` memo (which derives users from log entries only) with a combined list: all profile emails + any additional emails found in logs
3. This ensures every system user appears in the "User" filter dropdown regardless of whether they have audit entries

```typescript
// New query alongside existing audit log query
const { data: allProfiles } = useQuery({
  queryKey: ["audit-log-users"],
  queryFn: async () => {
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .not("email", "is", null)
      .order("email");
    return data ?? [];
  },
});

// Updated uniqueUsers: merge profile emails + log emails
const uniqueUsers = useMemo(() => {
  const emails = new Set<string>();
  (allProfiles ?? []).forEach((p) => { if (p.email) emails.add(p.email); });
  (logs ?? []).forEach((log) => { if (log.user_email) emails.add(log.user_email); });
  return Array.from(emails).sort();
}, [allProfiles, logs]);
```

No database or edge function changes needed -- the logging infrastructure is already in place and working. This is purely a UI fix to show all users in the filter.

