

## Plan: Enrich `send-contract-email` to Match On-Screen Contract

### Problem

The `send-contract-email` edge function (triggered from ContractPreviewDialog's "Email" button) builds a **minimal 5-row HTML table** with only Contract ID, Employee, Employer, Season, and Signed date. It completely omits:

- §4 Employment form (Seasonal/Permanent, dates)
- Position & duties
- Salary details
- Working hours
- Schedule/vacation info
- Signing metadata (place, date)
- A link to view the full contract

Meanwhile, the on-screen preview (`ContractDocument.tsx`) shows all 13+ sections. The user expects the emailed version to contain the same information.

Per the previously approved "Summary + exact link" format, the email should include a **rich summary** of key contract details plus a **secure link** to the full contract view.

### Changes

#### 1. `supabase/functions/send-contract-email/index.ts` — Rebuild email HTML

Replace the minimal 5-row table (lines 102-138) with a comprehensive summary that pulls from `contract.form_data`:

- **Header**: Employment Contract title + contract code + season
- **Employer section**: Company name, org number, address
- **Employee section**: Name, personal number, nationality, address
- **§4 Employment form**: Type (Seasonal/Permanent/etc.), from/to dates
- **Position**: Title, job type, experience level
- **Working time**: Weekly hours, start/end times
- **Salary**: Monthly/hourly amount, currency
- **Signing info**: Employee signed date/place, employer signed date/place (from signing metadata)
- **Link**: If `contract.signing_token` exists, include a "View Full Contract" button linking to `/sign/{token}` (the signing page already handles already-signed contracts in read-only mode)

Style the email to match the contract document's visual identity (Georgia serif, same color scheme as `CONTRACT_PRINT_CSS`).

#### 2. `supabase/functions/send-contract-email/index.ts` — Expand data query

Update the select query (line 61) to also fetch `form_data`, `signing_token`, `employee_signing_metadata`, `employer_signing_metadata`, `employee_signed_at`, `employer_signed_at` — most of these are already included via `select *`.

### Files to Edit

| File | Change |
|------|--------|
| `supabase/functions/send-contract-email/index.ts` | Rebuild email HTML with full contract summary + view link |

### Technical Details

The email HTML will be structured as a standalone inline-styled email (no CSS variables, all inline styles) that includes sections mirroring the contract document:

```text
┌─────────────────────────────────────────┐
│  EMPLOYMENT CONTRACT / ANSTÄLLNINGSAVTAL │
│  Contract: LF-2026-001 · Season: 2026   │
├─────────────────────────────────────────┤
│  §1 EMPLOYER: Company, Org#, Address     │
│  §2 EMPLOYEE: Name, PersonalNo, Address  │
│  §3 POSITION: Title, Job Type            │
│  §4 EMPLOYMENT FORM: Seasonal, Dates     │
│  §5 WORKING TIME: Hours, Times           │
│  §8 SALARY: Amount, Currency             │
│  SIGNING: Place, Date, Status            │
├─────────────────────────────────────────┤
│  [View Full Contract] button             │
│  "Contact HR for questions"              │
└─────────────────────────────────────────┘
```

All data comes from the already-fetched `contract.form_data` JSONB + the `companySnapshot` frozen at send time, ensuring the email matches the signed version exactly.

