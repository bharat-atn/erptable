
Goal: make the audit log trustworthy for login/logout + database changes, and make the UI show the real dataset (not just the newest subset).

What I found
- Yash has recent profile activity (`profiles.last_sign_in_at` is recent), but no recent `audit_log` rows for him.
- The audit UI currently fetches only the latest 500 rows, then filters locally. This can falsely show “no entries” for a user with older/sparser events.
- Logging is not fully reliable today:
  1) auth logging in `src/pages/Index.tsx` is fire-and-forget (`.then()` with no error handling/retry),
  2) some sign-out paths do not log logout,
  3) several backend functions insert into `audit_log` without `org_id` (required), so those audit inserts can fail silently,
  4) several public tables still have no audit trigger, so DB changes there are not captured.

Implementation plan

1) Fix auth event reliability (login/logout)
- File: `src/pages/Index.tsx`
  - Replace fire-and-forget auth logging with awaited, error-handled calls.
  - Handle both `SIGNED_IN` and `INITIAL_SESSION` safely (with dedupe guard) so OAuth/session-restore paths are not missed.
  - Keep `last_sign_in_at` update and auth audit write in one controlled async flow with explicit failure handling.
- Files: `src/components/dashboard/Sidebar.tsx`, `OrganizationPicker.tsx`, `AppLauncher.tsx`, `LoginProfileDialog.tsx`, `PendingApproval.tsx`
  - Centralize sign-out flow so every logout path writes `LOGOUT` before sign-out.
  - Remove silent logout paths that currently skip audit.

2) Fix audit-log writes from backend functions
- Files:
  - `supabase/functions/invite-user/index.ts`
  - `supabase/functions/send-invitation-email/index.ts`
  - `supabase/functions/send-signing-email/index.ts`
  - `supabase/functions/send-contract-email/index.ts`
  - `supabase/functions/send-role-notification/index.ts`
  - `supabase/functions/cleanup-orphan-user/index.ts`
- Add `org_id` explicitly on every manual `audit_log` insert (derive from target record org, or caller profile current org, with fallback).
- Remove silent loss: keep try/catch, but log actionable error details and include context for debugging.

3) Complete DB-change coverage with triggers
- New migration:
  - Extend `public.audit_trigger_func()` org resolution so non-`org_id` tables still get a valid `org_id` fallback.
  - Add audit triggers for currently unaudited public tables:
    - `profiles`, `org_members`, `organizations`, `pending_role_assignments`,
    - `user_app_access`, `role_app_access`, `role_sidebar_access`,
    - `app_launcher_config`, `app_versions`, `contract_id_year_counters`.
- Keep sensitive-field masking in trigger payloads; expand masking for profile-sensitive fields.

4) Fix Audit Log UI to query the real dataset
- File: `src/components/dashboard/AuditLogView.tsx`
  - Move user/category/action/date filtering server-side (not only local array filtering).
  - Add pagination/infinite loading instead of hard 500-only behavior.
  - Keep search UX, but apply it over server-filtered pages.
  - Show total count + “showing N of M” so users understand scope.

5) Validation (end-to-end, mandatory)
- Test matrix:
  - Yash login/logout (and another user) -> auth events appear immediately.
  - Invite/re-invite + role update -> corresponding audit entries present.
  - Profile edit, org membership change, app access change -> audited.
  - Filter by user/email/date/action returns expected rows even beyond 500 history.
- Confirm no silent failures in console/network/backend logs during these flows.

Technical details
- Root causes are mixed: data capture gaps + query visibility limitations.
- This plan addresses both:
  - capture completeness (auth + triggers + backend writes),
  - retrieval correctness (server-side filtering + pagination),
  - reliability (no fire-and-forget critical audit writes).
- Important limitation: already-missed historical events cannot be reconstructed perfectly; from implementation point onward, logging becomes consistent and auditable.
