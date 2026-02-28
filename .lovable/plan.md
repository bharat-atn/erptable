

## Revised Plan: Multi-Tenant Organization Isolation

Based on your selections plus additional best-practice considerations.

### What's Changed from the Previous Plan

1. **Session variable RLS** instead of join-based — significantly faster at scale
2. **Super Admin bypass** — admins see all orgs without switching
3. **Sandbox cloning** — with sensitive data scrubbing
4. **Folder-based storage** — `/org_id/...` path prefix in the existing `signatures` bucket

### Additional Considerations Not in the Original Plan

**A. Supabase client-side org_id injection**
Every Supabase query from the browser currently goes through `supabase` client. We need a wrapper or hook that calls a DB function `set_org_context(org_id)` at the start of each session/switch. This sets `app.current_org_id` as a Postgres session variable that all RLS policies read via `current_setting('app.current_org_id')`. This is more performant than joining `org_members` on every single query.

**B. Indexes on org_id**
Every table getting `org_id` also needs a B-tree index on it. Without this, RLS filtering on large tables degrades.

**C. Default org_id on INSERT**
A `BEFORE INSERT` trigger on each data table that auto-fills `org_id` from `current_setting('app.current_org_id')` if not provided. This prevents developers from accidentally inserting rows without org context.

**D. Org-scoped triggers and functions**
The existing triggers (`generate_employee_code`, `generate_contract_code`, `on_employee_deleted`, `on_contract_deleted`) currently operate globally. They need to be org-scoped — e.g., employee code counters must be per-org, not global.

**E. Invitation and signing token scoping**
Public RPC functions (`get_invitation_by_token`, `submit_onboarding`, `get_contract_for_signing`, `submit_employee_signature`) use token-based access without auth. These are already secure (token is the credential), but the org_id column must still be present on the rows they touch for consistency.

**F. Audit log org scoping**
The `audit_trigger_func` must capture `org_id` from session context and store it on audit_log rows so each org's audit trail is isolated.

### Implementation Status

- ✅ **Step 1**: Core tables (`organizations`, `org_members`) + security functions (`set_org_context`, `is_org_member_current`, `is_super_admin`)
- ✅ **Step 2**: `org_id` added to all 16 data tables with indexes, auto-fill triggers, and backfill
- ✅ **Step 3**: All RLS policies rewritten with org scoping + super admin bypass
- ✅ **Step 4**: Triggers org-scoped (`generate_employee_code`, `generate_contract_code`, counters)
- ✅ **Step 6**: `OrgProvider` context + `useOrg()` hook created
- ✅ **Step 7**: Organization Picker page created

### Remaining Steps

**Step 5: Storage path migration**
- Update `upload-employee-signature` edge function to store files under `/org_id/signatures/...`
- Update employer signature upload to use org_id prefix
- Add storage RLS policy checking path prefix matches user's org

**Step 8: React — Update all queries**
- Every `.from('table')` call gets `.eq('org_id', orgId)` filter added
- All `useQuery` keys include `orgId` for proper cache isolation
- Sidebar header shows current org with switcher dropdown

**Step 9: React — Sandbox visual indicators**
- Dashed orange border around entire layout when in sandbox
- "SANDBOX" badge in sidebar header
- Persistent top bar: "You are in a sandbox environment"

**Step 10: Edge functions — Org validation**
- All edge functions that read/write data validate org_id membership server-side
- Clone endpoint: new edge function `clone-org-data` that copies data with scrubbing (nulls out tokens, signature URLs, resets counters)

### Security Guarantees

1. Database-level: RLS + session variable = zero cross-org leakage even with client bugs
2. Auto-fill trigger: impossible to insert data without org context
3. Super Admin bypass is explicit and audited
4. Storage: path-based isolation with RLS on `storage.objects`
5. Edge functions: server-side org validation independent of client
6. Indexes: no performance degradation from org filtering
