
Problem confirmed from live data:
- Multiple contracts were sent with `company_id = null`.
- The signing RPC (`get_contract_for_signing`) reads employer fields only from `contracts.company_id -> companies`, so employer data becomes blank on the signing page.
- This can happen when resuming drafts (company shown in UI state) without persisting `company_id` back to the contract before sending.

Implementation plan (prevent + self-heal + fallback):

1) Prevent missing employer data before send (HR side)
- File: `src/components/dashboard/ContractDetailsStep.tsx`
- In `handleSendForSigning`, update contract with:
  - `company_id: company.id`
  - `form_data.companySnapshot` (name, org_number, address, postcode, city)
  - existing `form_data`
- Add explicit pre-send validation for required employer fields:
  - name, org number, address, postcode, city
- Disable “Send for E-Signing” if employer data is incomplete and show a clear blocking warning.

2) Make sending function fail-safe and ordered
- File: `supabase/functions/send-signing-email/index.ts`
- Refactor flow:
  1. Load contract + employer context first (do not set signing status yet).
  2. If `company_id` missing: try resolve a default company for `org_id`.
  3. Build/persist `companySnapshot` on contract.
  4. Validate required employer fields; if incomplete, return 422 with actionable message.
  5. Only then generate token and set `signing_status = sent_to_employee`.
- This guarantees no tokenized signing link is issued for incomplete employer data.

3) Add backend fallback for already-issued links
- Migration: update `public.get_contract_for_signing(_token)`
- Return employer fields using fallback chain:
  - `companies.*`
  - `contracts.form_data.companySnapshot.*`
  - `organizations.*` (last fallback)
- This immediately improves existing links where company relation is missing.

4) Fix contract creation so future drafts start with employer linked
- Migration: update `public.submit_onboarding(...)`
- When inserting contract, set `company_id` to first company in the same org (if available), instead of always null.
- Keep current org isolation behavior unchanged.

5) Ensure new organizations always get an initial company record
- File: `src/components/dashboard/CreateOrganizationDialog.tsx`
- After organization creation, also insert a company row seeded from org details.
- This removes the “org exists but no company source exists” condition.

6) One-time data remediation migration
- Create missing company rows for orgs that have none (seed from organization fields).
- Backfill `contracts.company_id` where null using org default company.
- Backfill `form_data.companySnapshot` for contracts missing snapshot.
- Scope to safe, idempotent updates.

Technical details (concise):
- Required employer fields for sending/signing validity:
  - `name`, `org_number`, `address`, `postcode`, `city`
- Snapshot shape (inside `form_data`):
  - `companySnapshot: { name, orgNumber, address, postcode, city }`
- SQL fallback idea in `get_contract_for_signing`:
  - `coalesce(co.name, c.form_data->'companySnapshot'->>'name', o.name)` etc.
- No changes to auth model or RLS policies needed for this fix.

Validation checklist after implementation:
1. Resume an old draft with null `company_id` and send for signing → employer data appears correctly on `/sign/:token`.
2. Try sending with missing employer fields → blocked with clear error, no token/status change.
3. New onboarding submission creates draft with populated `company_id` when org company exists.
4. Existing already-sent contracts with missing company relation now show fallback employer data on signing page.
5. End-to-end test: Create invitation → onboarding submit → complete contract → send signing link → review/sign on candidate page with employer section fully populated.
